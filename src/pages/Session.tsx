import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, X } from "lucide-react";
import { getScenarioById, getScoreColor } from "@/data/scenarios";
import SessionContextForm, { type UserContext, type GeneratedPersona } from "@/components/SessionContextForm";
import {
  callGroq,
  generatePersonaFromGroq,
  buildSessionSystemPrompt,
  parseSessionResponse,
  getPhaseLabel,
  type ScoreData,
  type SessionPersona,
} from "@/lib/groq";

interface Message {
  role: "ai" | "user";
  content: string;
}

interface FeedbackTag {
  label: string;
  type: "good" | "warning" | "bad";
}

interface RoundFeedback {
  tags: FeedbackTag[];
  scoreDelta: number;
  roundSummary: string;
}

const roundHints = [
  "Tip: Open by stating your number confidently. Don't ask — tell.",
  "Tip: They're deflecting. Redirect to your specific evidence.",
  "Tip: A budget ceiling isn't a no. Ask about timing, not permission.",
  "Tip: This is the hardest moment. Don't back down — reframe instead.",
  "Tip: Push for specific written commitments with dates.",
  "Tip: Confirm everything. Summarize what was agreed.",
];

const PHASE_BANNERS: Record<number, string> = {
  2: "Stakes are rising",
  3: "Escalation incoming",
  4: "Crisis point — hold your ground",
  5: "The tide may be turning",
};

export default function Session() {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const scenario = getScenarioById(scenarioId || "");

  // Context form state
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [clientPersona, setClientPersona] = useState<GeneratedPersona | null>(null);

  // AI persona (from Groq)
  const [aiPersona, setAiPersona] = useState<SessionPersona | null>(null);
  const [isGeneratingPersona, setIsGeneratingPersona] = useState(false);

  // Session state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(50);
  const [criteriaHits, setCriteriaHits] = useState<boolean[]>([false, false, false, false, false]);
  const [criteriaScores, setCriteriaScores] = useState<number[]>([0, 0, 0, 0, 0]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<RoundFeedback | null>(null);
  const [showContext, setShowContext] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [roundDeltas, setRoundDeltas] = useState<number[]>([]);
  const [roundSummaries, setRoundSummaries] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const personaName = aiPersona?.managerName || clientPersona?.name || "Manager";
  const personaRole = aiPersona?.managerRole || clientPersona?.role || "Manager";
  const personaCompany = aiPersona?.companyName || clientPersona?.company || "Company";
  const personaInitials = personaName.replace(/Dr\.\s*/, "").split(" ").map(w => w[0]).join("").slice(0, 2);

  // Generate persona and opening message via Groq when context is submitted
  useEffect(() => {
    if (!userContext || !scenario || aiPersona) return;

    setIsGeneratingPersona(true);
    setIsTyping(true);

    generatePersonaFromGroq(
      userContext.jobTitle,
      userContext.experience,
      userContext.industry,
      userContext.companySize,
      scenario.title,
      scenario.context
    )
      .then((persona) => {
        setAiPersona(persona);
        setMessages([{ role: "ai", content: persona.openingMessage }]);
      })
      .catch(() => {
        // Fallback
        const fallbackMsg = "Thanks for sitting down with me. I've been looking at your situation and I think we should talk through this directly. Where would you like to start?";
        setAiPersona({
          managerName: clientPersona?.name || "Alex Morgan",
          managerRole: clientPersona?.role || "Senior Manager",
          companyName: clientPersona?.company || "Meridian Group",
          openingMessage: fallbackMsg,
        });
        setMessages([{ role: "ai", content: fallbackMsg }]);
      })
      .finally(() => {
        setIsGeneratingPersona(false);
        setIsTyping(false);
      });
  }, [userContext, scenario]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, currentFeedback]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping || sessionComplete || !scenario || !userContext) return;

    const userMsg = input.trim();
    setInput("");
    setError(null);
    setCurrentFeedback(null);

    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setShowContext(false);
    setIsTyping(true);

    try {
      // Build conversation history for Groq
      const groqMessages = [
        {
          role: "system" as const,
          content: buildSessionSystemPrompt(
            personaName, personaRole, personaCompany,
            userContext.jobTitle, userContext.experience,
            userContext.industry, userContext.companySize,
            round, scenario.context, scenario.criteria
          ),
        },
        ...newMessages.map((m) => ({
          role: (m.role === "ai" ? "assistant" : "user") as "assistant" | "user",
          content: m.content,
        })),
      ];

      const raw = await callGroq(groqMessages);
      const { content, scoreData } = parseSessionResponse(raw);

      // Update scores
      if (scoreData) {
        const newScore = Math.min(100, Math.max(0, score + scoreData.scoreDelta));
        setScore(newScore);
        setRoundDeltas(prev => [...prev, scoreData.scoreDelta]);
        setRoundSummaries(prev => [...prev, scoreData.roundSummary]);

        // Update criteria
        const booleans = [
          scoreData.anchoring,
          scoreData.usedEvidence,
          scoreData.avoidedHedging,
          scoreData.showedComposure,
          scoreData.heldPosition,
        ];
        setCriteriaHits(prev => prev.map((v, i) => v || booleans[i]));
        setCriteriaScores(prev =>
          prev.map((v, i) => {
            if (booleans[i]) return Math.min(100, v + Math.floor(Math.random() * 15 + 10));
            return Math.min(100, v + Math.floor(Math.random() * 5));
          })
        );

        setCurrentFeedback({
          tags: scoreData.feedbackTags || [],
          scoreDelta: scoreData.scoreDelta,
          roundSummary: scoreData.roundSummary,
        });
      }

      // Add AI message
      setMessages(prev => [...prev, { role: "ai", content }]);

      if (round >= 6) {
        setSessionComplete(true);
      } else {
        setRound(r => r + 1);
      }
    } catch (err) {
      setError("The AI is taking a moment. Try sending again.");
      console.error("Groq error:", err);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, sessionComplete, round, score, messages, scenario, userContext, personaName, personaRole, personaCompany]);

  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Scenario not found</h1>
          <Link to="/scenarios" className="text-sm font-medium" style={{ color: "#7C6FF7" }}>← Back to scenarios</Link>
        </div>
      </div>
    );
  }

  if (!userContext) {
    return (
      <SessionContextForm
        scenarioTitle={scenario.title}
        scenarioEmoji={scenario.emoji}
        onStart={(ctx, persona) => {
          setUserContext(ctx);
          setClientPersona(persona);
        }}
      />
    );
  }

  const scoreColor = getScoreColor(score);

  const handleViewDebrief = () => {
    navigate("/debrief/session", {
      state: {
        messages,
        score,
        criteriaScores,
        criteriaHits,
        roundDeltas,
        roundSummaries,
        scenarioId,
        scenarioTitle: scenario.title,
        personaName,
        personaRole,
        personaCompany,
        userContext,
      },
    });
  };

  return (
    <div className="min-h-screen pt-16 flex flex-col" style={{ background: "#07080F" }}>
      {/* Top Bar */}
      <div className="h-14 flex items-center justify-between px-4 sm:px-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/scenarios")} className="p-1.5 rounded-lg text-pb-text-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-foreground">{scenario.emoji} {scenario.title}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${scenario.categoryColor}18`, color: scenario.categoryColor }}>
            {scenario.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6].map(r => (
              <div
                key={r}
                className={`w-2.5 h-2.5 rounded-full transition-all ${r === round && !sessionComplete ? "animate-pulse" : ""}`}
                style={{
                  background: r < round || sessionComplete ? "#7C6FF7" : r === round ? "#7C6FF7" : "rgba(255,255,255,0.15)",
                  boxShadow: r === round && !sessionComplete ? "0 0 8px rgba(124,111,247,0.5)" : "none",
                }}
              />
            ))}
            <span className="text-xs text-pb-text-muted ml-2">Round {Math.min(round, 6)}/6</span>
          </div>
          <button onClick={() => navigate("/scenarios")} className="px-3 py-1.5 rounded-lg text-xs font-medium text-pb-text-secondary hover:text-foreground transition-colors" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
            End Session
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Context card */}
            <AnimatePresence>
              {showContext && (
                <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="card-pb p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-pb-text-muted">Scenario Context</span>
                    <button onClick={() => setShowContext(false)} className="text-pb-text-muted hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  <p className="text-sm text-pb-text-secondary leading-relaxed">{scenario.context}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-pb-text-muted">
                    <span>🏢 {personaCompany}</span>
                    <span>🗣️ {personaName}, {personaRole}</span>
                    <span>👤 You: {userContext.jobTitle}, {userContext.industry}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Round transition banner */}
            {PHASE_BANNERS[round] && messages.length > 2 && !sessionComplete && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-2 px-4 rounded-lg text-xs font-semibold" style={{ background: "rgba(245,166,35,0.08)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.15)" }}>
                ⚡ Round {round} — {PHASE_BANNERS[round]}
              </motion.div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === "user" ? "max-w-[85%] ml-auto flex-row-reverse" : "max-w-[85%]"}`}>
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={msg.role === "ai" ? { background: "rgba(245,101,101,0.15)", color: "#F56565" } : { background: "rgba(108,99,246,0.15)", color: "#7C6FF7" }}>
                  {msg.role === "ai" ? personaInitials : "Y"}
                </div>
                <div className="flex-1">
                  <p className={`text-xs text-pb-text-muted mb-1 ${msg.role === "user" ? "text-right" : ""}`}>
                    {msg.role === "ai" ? `${personaName} — ${personaRole}` : "You"}
                  </p>
                  <div className="rounded-xl p-3.5 text-sm text-foreground leading-relaxed" style={msg.role === "ai" ? { background: "rgba(245,101,101,0.05)", border: "1px solid rgba(245,101,101,0.1)" } : { background: "rgba(108,99,246,0.07)", border: "1px solid rgba(108,99,246,0.12)" }}>
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: "rgba(245,101,101,0.15)", color: "#F56565" }}>
                  {personaInitials}
                </div>
                <div className="rounded-xl p-4 flex items-center gap-1.5" style={{ background: "rgba(245,101,101,0.05)", border: "1px solid rgba(245,101,101,0.1)" }}>
                  <div className="w-2 h-2 rounded-full bg-pb-text-muted typing-dot-1" />
                  <div className="w-2 h-2 rounded-full bg-pb-text-muted typing-dot-2" />
                  <div className="w-2 h-2 rounded-full bg-pb-text-muted typing-dot-3" />
                </div>
              </div>
            )}

            {/* Feedback strip */}
            <AnimatePresence>
              {currentFeedback && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 flex-wrap py-2 px-3 rounded-xl" style={{ background: "rgba(61,214,140,0.04)", border: "1px solid rgba(61,214,140,0.1)" }}>
                  {currentFeedback.tags.map((t, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.15 }}
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{
                        background: t.type === "good" ? "rgba(61,214,140,0.1)" : t.type === "bad" ? "rgba(245,101,101,0.1)" : "rgba(245,166,35,0.1)",
                        color: t.type === "good" ? "#3DD68C" : t.type === "bad" ? "#F56565" : "#F5A623",
                      }}
                    >
                      {t.type === "good" ? "✓" : t.type === "bad" ? "✗" : "⚠"} {t.label}
                    </motion.span>
                  ))}
                  <span className="text-xs font-bold ml-auto" style={{ color: currentFeedback.scoreDelta > 0 ? "#3DD68C" : "#F56565" }}>
                    {currentFeedback.scoreDelta > 0 ? "+" : ""}{currentFeedback.scoreDelta} pts
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {error && (
              <div className="text-center py-3 px-4 rounded-xl text-xs font-medium" style={{ background: "rgba(245,101,101,0.08)", color: "#F56565", border: "1px solid rgba(245,101,101,0.15)" }}>
                {error}
              </div>
            )}

            {/* Session complete */}
            {sessionComplete && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-pb p-6 text-center">
                <h3 className="text-xl font-bold text-foreground mb-2">Session Complete</h3>
                <div className="text-5xl font-bold tabular-nums mb-2" style={{ color: scoreColor }}>{score}</div>
                <p className="text-sm text-pb-text-secondary mb-6">Final Score</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button onClick={handleViewDebrief} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground bg-gradient-primary">
                    View Debrief →
                  </button>
                  <button onClick={() => {
                    setMessages([]);
                    setRound(1);
                    setScore(50);
                    setCriteriaScores([0, 0, 0, 0, 0]);
                    setCriteriaHits([false, false, false, false, false]);
                    setSessionComplete(false);
                    setShowContext(true);
                    setCurrentFeedback(null);
                    setRoundDeltas([]);
                    setRoundSummaries([]);
                    setAiPersona(null);
                    setUserContext(null);
                    setClientPersona(null);
                    setError(null);
                  }} className="px-6 py-2.5 rounded-lg text-sm font-medium text-pb-text-secondary" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
                    Practice Again
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input area */}
          {!sessionComplete && (
            <div className="p-4 sm:p-6" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs text-pb-text-muted mb-2">{roundHints[round - 1] || ""}</p>
              <div className="flex items-end gap-3">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type your response..."
                  rows={2}
                  disabled={isTyping || isGeneratingPersona}
                  className="flex-1 resize-none rounded-xl p-3.5 text-sm text-foreground placeholder:text-pb-text-muted outline-none transition-all disabled:opacity-50"
                  style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#6C63F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping || isGeneratingPersona}
                  className="px-5 py-3 rounded-xl text-sm font-semibold text-primary-foreground bg-gradient-primary hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
                >
                  Send <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-pb-text-muted mt-1.5">Enter to send · Shift+Enter for new line</p>
            </div>
          )}
        </div>

        {/* Score Panel */}
        <div className="w-full lg:w-[240px] p-4 sm:p-6 lg:border-l flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-wider text-pb-text-muted mb-2">Live Score</p>
            <div className="text-4xl font-bold tabular-nums mb-4 transition-colors duration-300" style={{ color: scoreColor }}>
              {score}<span className="text-lg text-pb-text-muted">/100</span>
            </div>

            <div className="space-y-3">
              {(scenario.criteria || []).map((c, i) => (
                <div key={c}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-pb-text-secondary">{c}</span>
                    <span className="text-xs" style={{ color: criteriaHits[i] ? "#3DD68C" : "rgba(255,255,255,0.3)" }}>
                      {criteriaHits[i] ? "✓" : "~"}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${criteriaScores[i]}%`,
                        background: criteriaScores[i] > 60 ? "#3DD68C" : criteriaScores[i] > 30 ? "#F5A623" : "#444C6E",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {currentFeedback?.roundSummary && (
              <div className="mt-4 p-3 rounded-xl text-xs text-pb-text-secondary leading-relaxed" style={{ background: "rgba(108,99,246,0.06)", border: "1px solid rgba(108,99,246,0.1)" }}>
                💡 {currentFeedback.roundSummary}
              </div>
            )}

            {/* Round history */}
            {roundDeltas.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-pb-text-muted mb-2">Rounds</p>
                <div className="flex items-center gap-1.5">
                  {roundDeltas.map((d, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        background: d >= 10 ? "rgba(61,214,140,0.15)" : d >= 0 ? "rgba(245,166,35,0.15)" : "rgba(245,101,101,0.15)",
                        color: d >= 10 ? "#3DD68C" : d >= 0 ? "#F5A623" : "#F56565",
                      }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
