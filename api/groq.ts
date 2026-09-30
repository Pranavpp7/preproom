import type { VercelRequest, VercelResponse } from "@vercel/node";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";
const MAX_TOKENS_CAP = 3000;
const MAX_MESSAGES = 40;
const MAX_BODY_CHARS = 40_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type RateBucket = { count: number; resetAt: number };

const rateBuckets = new Map<string, RateBucket>();

function clientIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count += 1;
  return true;
}

function isMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const msg = value as Record<string, unknown>;
  return (
    (msg.role === "system" || msg.role === "user" || msg.role === "assistant") &&
    typeof msg.content === "string"
  );
}

function totalContentChars(messages: ChatMessage[]): number {
  return messages.reduce((sum, m) => sum + m.content.length, 0);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = clientIp(req);
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Rate limit exceeded. Try again shortly." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY is not configured" });
  }

  const body = req.body;
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { messages, temperature, max_tokens } = body as {
    messages?: unknown;
    temperature?: unknown;
    max_tokens?: unknown;
  };

  if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isMessage)) {
    return res.status(400).json({ error: "messages must be a non-empty array of {role, content}" });
  }

  if (messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: `Too many messages (max ${MAX_MESSAGES})` });
  }

  if (totalContentChars(messages) > MAX_BODY_CHARS) {
    return res.status(400).json({ error: `Request too large (max ${MAX_BODY_CHARS} characters)` });
  }

  const temp =
    typeof temperature === "number" && Number.isFinite(temperature)
      ? Math.min(2, Math.max(0, temperature))
      : 0.7;

  const requestedTokens =
    typeof max_tokens === "number" && Number.isFinite(max_tokens) ? Math.floor(max_tokens) : 600;
  const maxTokens = Math.min(MAX_TOKENS_CAP, Math.max(1, requestedTokens));

  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: temp,
        max_tokens: maxTokens,
        reasoning_effort: "low",
        include_reasoning: false,
      }),
    });

    if (!groqRes.ok) {
      // Do not log request bodies (may contain CVs / conversation text).
      return res.status(502).json({ error: `Groq upstream error ${groqRes.status}` });
    }

    const data = (await groqRes.json()) as {
      choices?: { message?: { content?: string }; finish_reason?: string }[];
    };
    const content = data.choices?.[0]?.message?.content || "";
    const finishReason = data.choices?.[0]?.finish_reason;

    return res.status(200).json({ content, finish_reason: finishReason });
  } catch {
    return res.status(502).json({ error: "Failed to reach Groq" });
  }
}
