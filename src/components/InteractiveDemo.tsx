import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface FeedbackTag {
  label: string;
  type: "good" | "warning";
}

interface Message {
  role: "ai" | "user";
  content: string;
  tags?: FeedbackTag[];
}

const SYSTEM_PROMPT = `You are Sarah Chen, Engineering Manager at Meridian Analytics. The user is Alex Morgan, a Junior Data Analyst asking for a raise from $62k to $78k. You are firm but fair. Respond in 2-4 sentences, conversational and human. After your response add the delimiter ---TAGS--- then a JSON array of 2-3 feedback tags like [{"label": "Used market data", "type": "good"}, {"label": "Could anchor harder", "type": "warning"}]`;

const INITIAL_AI_MESSAGE: Message = {
  role: "ai",
  content:
    "Look, I want to be honest with you — I think you've had a strong year. But $78k is a significant jump from $62k. Our standard band for mid-level analysts tops out at $71k, and I've already gone to bat for you with HR. I'm not sure I can push further than that.",
};

const MAX_EXCHANGES = 2;

function parseAIResponse(raw: string): { content: string; tags: FeedbackTag[] } {
  const parts = raw.split("---TAGS---");
  const content = parts[0].trim().replace(/^"|"$/g, "");
  let tags: FeedbackTag[] = [];
  if (parts[1]) {
    try {
      const jsonStr = parts[1].trim();
      const match = jsonStr.match(/\[[\s\S]*\]/);
      if (match) {
        tags = JSON.parse(match[0]);
      }
    } catch {
      // ignore parse errors
    }
  }
  return { content, tags };
}

export default function InteractiveDemo() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_AI_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isDemoComplete = exchangeCount >= MAX_EXCHANGES;

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading || isDemoComplete) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      const { content, tags } = parseAIResponse(
        "I hear you, and I appreciate the research. But I need to be transparent — even if the market says $78k, our internal equity and budget cycle mean I can realistically get you to $73k right now. Let's talk about what else we can do to bridge that gap. ---TAGS--- [{\"label\": \"Acknowledged your point\", \"type\": \"good\"}, {\"label\": \"Redirected the conversation\", \"type\": \"warning\"}]"
      );
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "ai", content, tags }]);
        setExchangeCount((c) => c + 1);
        setIsLoading(false);
      }, 1500);
      return;
    }

    try {
      const conversationMessages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        {
          role: "assistant" as const,
          content: INITIAL_AI_MESSAGE.content,
        },
        ...messages
          .filter((m) => m !== INITIAL_AI_MESSAGE)
          .map((m) => ({
            role: (m.role === "ai" ? "assistant" : "user") as "assistant" | "user",
            content: m.content,
          })),
        { role: "user" as const, content: text },
      ];

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: conversationMessages,
          temperature: 0.8,
          max_tokens: 300,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "";
      const { content, tags } = parseAIResponse(raw);

      setMessages((prev) => [...prev, { role: "ai", content, tags }]);
      setExchangeCount((c) => c + 1);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "I appreciate you bringing data to the table. That shows initiative. But I have to work within the band HR approved — let me see if there's flexibility on the timeline for a mid-year review instead.",
          tags: [
            { label: "Showed composure", type: "good" },
            { label: "Deflected with timeline", type: "warning" },
          ],
        },
      ]);
      setExchangeCount((c) => c + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="card-pb overflow-hidden">
      {/* Chat messages */}
      <div ref={chatRef} className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {msg.role === "ai" ? (
              <div className="flex gap-3 max-w-[85%]">
                <div
                  className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ background: "rgba(245,101,101,0.15)", color: "#F56565" }}
                >
                  SC
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Sarah Chen — Engineering Manager, Meridian Analytics
                  </p>
                  <div
                    className="rounded-xl p-4 text-sm text-foreground leading-relaxed"
                    style={{
                      background: "rgba(245,101,101,0.06)",
                      border: "1px solid rgba(245,101,101,0.12)",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
                  <div
                    className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ background: "rgba(108,99,246,0.15)", color: "#7C6FF7" }}
                  >
                    Y
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 text-right">You</p>
                    <div
                      className="rounded-xl p-4 text-sm text-foreground leading-relaxed"
                      style={{
                        background: "rgba(108,99,246,0.08)",
                        border: "1px solid rgba(108,99,246,0.15)",
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
                {/* Feedback tags below user message */}
                {msg.tags && msg.tags.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-2 flex-wrap mt-2 ml-auto max-w-[85%] pr-12"
                    style={{ justifyContent: "flex-end" }}
                  >
                    {msg.tags.map((tag, ti) => (
                      <span
                        key={ti}
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={
                          tag.type === "good"
                            ? { background: "rgba(61,214,140,0.1)", color: "#3DD68C" }
                            : { background: "rgba(245,166,35,0.1)", color: "#F5A623" }
                        }
                      >
                        {tag.type === "good" ? "✓" : "⚠"} {tag.label}
                      </span>
                    ))}
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        ))}

        {/* Also show tags from the AI message that follows a user message */}
        {messages.length > 1 &&
          messages[messages.length - 1].role === "ai" &&
          messages[messages.length - 1].tags &&
          messages[messages.length - 1].tags!.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 flex-wrap px-2"
              style={{ borderTop: "1px solid rgba(61,214,140,0.12)", paddingTop: "12px" }}
            >
              {messages[messages.length - 1].tags!.map((tag, ti) => (
                <span
                  key={ti}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={
                    tag.type === "good"
                      ? { background: "rgba(61,214,140,0.1)", color: "#3DD68C" }
                      : { background: "rgba(245,166,35,0.1)", color: "#F5A623" }
                  }
                >
                  {tag.type === "good" ? "✓" : "⚠"} {tag.label}
                </span>
              ))}
            </motion.div>
          )}

        {/* Typing indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3 max-w-[85%]"
            >
              <div
                className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                style={{ background: "rgba(245,101,101,0.15)", color: "#F56565" }}
              >
                SC
              </div>
              <div
                className="rounded-xl px-5 py-4 flex items-center gap-1.5"
                style={{
                  background: "rgba(245,101,101,0.06)",
                  border: "1px solid rgba(245,101,101,0.12)",
                }}
              >
                <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot-1" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot-2" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot-3" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input area or CTA */}
      <div className="px-6 pb-5">
        <AnimatePresence mode="wait">
          {isDemoComplete ? (
            <motion.div
              key="cta"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-5 text-center"
              style={{
                background: "rgba(108,99,246,0.08)",
                border: "1px solid rgba(108,99,246,0.2)",
              }}
            >
              <p className="text-sm text-foreground font-medium mb-3">
                Want to see your full debrief and score?
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm text-primary-foreground bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                Start practicing free <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-end gap-3 rounded-xl p-3"
              style={{ background: "hsl(var(--pb-surface-2, 232 28% 12%))", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[36px] max-h-[100px] py-1.5"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold text-primary-foreground bg-gradient-primary disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
              >
                Send →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
