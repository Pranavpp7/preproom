import type { ScoringCriterion } from "@/data/scenarios";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "REMOVED_GROQ_KEY";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callGroq(
  messages: GroqMessage[],
  { temperature = 0.7, maxTokens = 400 }: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export interface SessionPersona {
  managerName: string;
  managerRole: string;
  companyName: string;
  openingMessage: string;
}

export async function generatePersonaFromGroq(
  jobTitle: string,
  experience: string,
  industry: string,
  companySize: string,
  scenarioTitle: string,
  scenarioContext: string
): Promise<SessionPersona> {
  const prompt = `Generate a realistic manager persona for a professional training simulation. The user is a ${jobTitle} with ${experience} of experience in the ${industry} sector at a ${companySize} company. The scenario is: ${scenarioTitle}. Context: ${scenarioContext}

Return ONLY valid JSON with no markdown, no code blocks:
{"managerName": "realistic full name for this industry", "managerRole": "appropriate manager title for this industry/company size", "companyName": "fictional but realistic company name for ${industry}", "openingMessage": "2-4 sentences, the manager's opening words, setting up the conversation naturally. Be conversational and human. Reference the specific situation."}`;

  const raw = await callGroq(
    [{ role: "user", content: prompt }],
    { temperature: 0.8, maxTokens: 300 }
  );

  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {}

  return {
    managerName: "Alex Morgan",
    managerRole: "Senior Manager",
    companyName: "Meridian Group",
    openingMessage: "Thanks for making time for this conversation. I've been looking forward to discussing this with you. Let's dive right in.",
  };
}

const PHASE_LABELS: Record<number, string> = {
  1: "opening",
  2: "buildup",
  3: "escalation",
  4: "crisis",
  5: "recovery",
  6: "resolution",
};

const PHASE_INSTRUCTIONS: Record<number, string> = {
  1: "Be firm but reasonable. Present the situation naturally. Don't be hostile.",
  2: "Introduce a real constraint — budget, policy, timing, or team dynamics. Make them work for it.",
  3: "Escalate with a new obstacle they didn't expect. Raise the stakes significantly.",
  4: "This is the hardest moment. Be firm, use emotional pressure or deflection tactics. Test their resolve.",
  5: "If the user has been performing well (shown strong evidence and composure), soften slightly and show an opening. If they've been weak, stay firm.",
  6: "Make a final decision based on how the entire conversation went. If they earned it, give them a win. If not, offer a compromise or hold firm.",
};

export function getPhaseLabel(round: number): string {
  return PHASE_LABELS[round] || "resolution";
}

export function buildSessionSystemPrompt(
  managerName: string,
  managerRole: string,
  companyName: string,
  jobTitle: string,
  experience: string,
  industry: string,
  companySize: string,
  round: number,
  scenarioContext: string,
  scoringCriteria: ScoringCriterion[]
): string {
  const phase = PHASE_LABELS[round] || "resolution";
  const instruction = PHASE_INSTRUCTIONS[round] || PHASE_INSTRUCTIONS[6];

  const criteriaList = scoringCriteria
    .map((c) => `${c.id}: ${c.label} (${c.tooltip})`)
    .join("\n");

  const criteriaIds = scoringCriteria.map((c) => c.id);

  return `You are ${managerName}, ${managerRole} at ${companyName}. The user is a ${jobTitle} with ${experience} experience in ${industry} at a ${companySize} company. This is a professional training simulation.

Situation: ${scenarioContext}

This is Round ${round} of 6 — the ${phase} phase. ${instruction}

CRITICAL SCORING RULE: If the user uses threatening language, ultimatums like "or I quit", aggressive demands, or unprofessional tone, the scoreDelta MUST be negative (-10 to -20) regardless of other criteria. Professional conduct is a prerequisite for a positive score. A real manager would disengage from an aggressive employee — reflect this in your response and scoring.

Respond in two parts separated by exactly ---SCORE---

Part 1: Your in-character response. 2-4 sentences. Conversational, human, realistic. Reference the specific details the user mentioned. React to exactly what they said. Never be robotic or use corporate jargon. Use contractions naturally.

Part 2: Valid JSON only, no markdown, no code blocks. Evaluate the user against these specific criteria:
${criteriaList}

Return this exact JSON structure:
{"criteria": {${criteriaIds.map((id) => `"${id}": true/false`).join(", ")}}, "feedbackTags": [{"label": "short description", "type": "good" or "warning" or "bad"}], "scoreDelta": number between -15 and 20, "roundSummary": "one sentence summary of this round"}

Be honest — don't give all true unless the user genuinely earned it.`;
}

export interface ScoreData {
  criteria: Record<string, boolean>;
  feedbackTags: { label: string; type: "good" | "warning" | "bad" }[];
  scoreDelta: number;
  roundSummary: string;
}

export function parseSessionResponse(raw: string): { content: string; scoreData: ScoreData | null } {
  const parts = raw.split("---SCORE---");
  const content = parts[0].trim().replace(/^"|"$/g, "");

  let scoreData: ScoreData | null = null;
  if (parts[1]) {
    try {
      const match = parts[1].trim().match(/\{[\s\S]*\}/);
      if (match) {
        scoreData = JSON.parse(match[0]);
      }
    } catch {}
  }

  return { content, scoreData };
}

export function buildDebriefPrompt(
  conversationHistory: { role: string; content: string }[],
  scenarioTitle: string,
  jobTitle: string,
  managerName: string,
  managerRole: string,
  companyName: string,
  finalScore: number,
  criteriaLabels: string[]
): GroqMessage[] {
  const transcript = conversationHistory
    .map((m) => `${m.role === "ai" ? managerName : "User"}: ${m.content}`)
    .join("\n\n");

  return [
    {
      role: "system",
      content: `You are an expert career coach reviewing a professional practice session. Be specific, direct, and reference exact quotes from the conversation. Never use the words 'good', 'great', 'improve', or 'work on' — they are banned. Every insight must reference something that actually happened in the conversation. The quote fields in topStrength and biggestMistake must contain VERBATIM text copied from the user's actual messages — do not paraphrase or summarize. If the user said "top band is low" use those exact words.`,
    },
    {
      role: "user",
      content: `Full conversation:\n${transcript}\n\nScenario: ${scenarioTitle}. User role: ${jobTitle}. Manager: ${managerName}, ${managerRole} at ${companyName}. Final score: ${finalScore}/100. Criteria evaluated: ${criteriaLabels.join(", ")}.

Return ONLY valid JSON, no markdown, no code blocks:
{"verdict": "2 sentences max", "topStrength": {"label": "short label", "explanation": "must quote user's exact words", "quote": "VERBATIM text from user messages only"}, "biggestMistake": {"label": "short label", "quote": "VERBATIM text from user messages only", "explanation": "why it hurt their position", "betterVersion": "what a strong negotiator would have said instead"}, "roundBreakdown": [{"round": 1, "scoreDelta": number, "summary": "one sentence describing what happened in this round"}], "nextScenarioId": "one of: salary-negotiation, ask-for-promotion, disagree-with-manager, bad-performance-review, job-interview", "nextScenarioReason": "one sentence why"}`,
    },
  ];
}
