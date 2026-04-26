import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, X, Info } from "lucide-react";
import SessionComplete from "@/components/SessionComplete";
import { getScenarioById } from "@/data/scenarios";
import SessionContextForm, { type UserContext, type GeneratedPersona, type InterviewType } from "@/components/SessionContextForm";
import ConversationPhaseBar from "@/components/RoundProgressBar";
import { useAuth } from "@/lib/auth";
import {
  callGroq,
  generatePersonaFromGroq,
  buildSessionSystemPrompt,
  parseSessionResponse,
  getConversationPhase,
  type ScoreData,
  type SessionPersona,
} from "@/lib/groq";
import {
  createInitialDimensionScores,
  applyDimensionUpdates,
  computeOverallScore,
  parseDimensionUpdates,
  getDimensionColor,
  DIMENSION_LABELS,
  DIMENSION_TOOLTIPS,
  DIMENSION_WEIGHTS,
  ALL_DIMENSION_IDS,
  type DimensionScores,
} from "@/lib/scoring";

const interviewTypeLabels: Record<InterviewType, string> = {
  screening: "Screening Call",
  behavioural: "Behavioural Interview",
  technical: "Technical Interview",
  "final-round": "Final Round",
};

interface Message {
  role: "ai" | "user";
  content: string;
}

interface FeedbackTag {
  label: string;
  type: "good" | "warning" | "bad";
}

interface ExchangeFeedback {
  tags: FeedbackTag[];
  scoreDelta: number;
  roundSummary: string;
}

interface PhaseHistoryEntry {
  phase: string;
  scoreDelta: number;
  summary: string;
  userQuote: string;
}

const coachHints = [
  "Open by stating your position clearly and confidently.",
  "They're pushing back — redirect to your specific evidence.",
  "A constraint isn't a no. Explore alternatives.",
  "Stay composed. Don't back down — reframe instead.",
  "Push for specific commitments with dates.",
  "Be direct and specific. Summarize what you want.",
];

const inputBarHints = [
  "State your ask clearly and confidently.",
  "A constraint isn't a no — work around it.",
  "New obstacle incoming — stay calm.",
  "Don't back down here. Reframe instead.",
  "Push for specific commitments.",
  "Be specific and direct.",
];

function buildContextCardText(
  scenarioId: string,
  userContext: UserContext,
  personaName: string,
  personaRole: string,
  personaCompany: string
): string {
  switch (scenarioId) {
    case "salary-negotiation": {
      const parts = [`You are a ${userContext.jobTitle} at a ${userContext.companySize} company.`];
      if (userContext.currentSalary && userContext.targetSalary) {
        parts.push(`You are negotiating your salary from ${userContext.currentSalary} to ${userContext.targetSalary}.`);
      } else if (userContext.targetSalary) {
        parts.push(`You are negotiating up to ${userContext.targetSalary}.`);
      }
      if (userContext.achievement) parts.push(`Your strongest achievement: ${userContext.achievement}.`);
      parts.push(`You are speaking with ${personaName}, ${personaRole} at ${personaCompany}.`);
      return parts.join(" ");
    }
    case "ask-for-promotion": {
      const parts = [`You are a ${userContext.jobTitle} at a ${userContext.companySize} company, ${userContext.experience} in your current position.`];
      if (userContext.targetRole) parts.push(`You want to be promoted to ${userContext.targetRole}.`);
      if (userContext.achievement) parts.push(`Key achievement: ${userContext.achievement}.`);
      parts.push(`You are speaking with ${personaName}, ${personaRole} at ${personaCompany}.`);
      return parts.join(" ");
    }
    case "challenge-a-decision": {
      const parts = [`You are a ${userContext.jobTitle}.`];
      if (userContext.decisionDescription) parts.push(`The decision you are challenging: ${userContext.decisionDescription}.`);
      if (userContext.alternative) parts.push(`Your proposed alternative: ${userContext.alternative}.`);
      parts.push(`You are speaking with ${personaName}, ${personaRole} at ${personaCompany}.`);
      return parts.join(" ");
    }
    case "respond-to-critical-feedback": {
      const parts = [`You are a ${userContext.jobTitle}.`];
      if (userContext.feedbackReceived) parts.push(`Feedback received: ${userContext.feedbackReceived}.`);
      if (userContext.counterEvidence) parts.push(`Your counter-evidence: ${userContext.counterEvidence}.`);
      parts.push(`You are speaking with ${personaName}, ${personaRole} at ${personaCompany}.`);
      return parts.join(" ");
    }
    case "ace-your-next-interview":
    case "job-interview":
      return `You are interviewing for ${userContext.interviewRole || "this role"}. ${userContext.interviewType ? interviewTypeLabels[userContext.interviewType] + ". " : ""}Your interviewer is ${personaName}, ${personaRole} at ${personaCompany}. They have reviewed your CV and are ready to begin.`;
    case "practice-any-conversation":
    case "custom-situation":
      return `Situation: ${userContext.customSituation || "A custom workplace conversation."}${userContext.customCounterpart ? ` You are speaking with ${userContext.customCounterpart}.` : ""}${userContext.customDesiredOutcome ? ` Your goal: ${userContext.customDesiredOutcome}.` : ""}${userContext.customWorry ? ` Your biggest concern: ${userContext.customWorry}.` : ""}`;
    default:
      return `You're meeting with ${personaName}, ${personaRole} at ${personaCompany}. ${userContext.jobTitle} · ${userContext.companySize} · ${userContext.experience} experience.`;
  }
}

export default function Session() {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const scenario = getScenarioById(scenarioId || "");

  useEffect(() => {
    if (!user) navigate("/signin", { replace: true });
  }, [user, navigate]);

  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [clientPersona, setClientPersona] = useState<GeneratedPersona | null>(null);
  const [aiPersona, setAiPersona] = useState<SessionPersona | null>(null);
  const [isGeneratingPersona, setIsGeneratingPersona] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [exchangeCount, setExchangeCount] = useState(0);
  const [dimensionScores, setDimensionScores] = useState<DimensionScores>(createInitialDimensionScores());
  const [criteriaHistory, setCriteriaHistory] = useState<Record<string, boolean[]>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<ExchangeFeedback | null>(null);
  const [showContext, setShowContext] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [completionReason, setCompletionReason] = useState<string | null>(null);
  const [finalVerdict, setFinalVerdict] = useState<string | null>(null);
  const [exchangeDeltas, setExchangeDeltas] = useState<number[]>([]);
  const [exchangeSummaries, setExchangeSummaries] = useState<string[]>([]);
  const [phaseHistory, setPhaseHistory] = useState<PhaseHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showScoreTooltip, setShowScoreTooltip] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const scoringCriteria = scenario?.scoringCriteria || [];

  // Derive overall score from dimension weights
  const score = computeOverallScore(dimensionScores);
  const scoreColor = score >= 70 ? "#3DD68C" : score >= 50 ? "#F5A623" : "#F56565";

  const personaName = aiPersona?.managerName || clientPersona?.name || "Manager";
  const personaRole = aiPersona?.managerRole || clientPersona?.role || "Manager";
  const personaCompany = aiPersona?.companyName || clientPersona?.company || "Company";
  const personaInitials = personaName.replace(/Dr\.\s*/, "").split(" ").map(w => w[0]).join("").slice(0, 2);

  const phase = getConversationPhase(exchangeCount, exchangeDeltas);

  useEffect(() => {
    if (!userContext || !scenario || aiPersona) return;

    setIsGeneratingPersona(true);
    setIsTyping(true);

    const interviewCtx = userContext.resumeText ? { resumeText: userContext.resumeText, interviewRole: userContext.interviewRole, interviewMotivation: userContext.interviewMotivation, interviewType: userContext.interviewType } : undefined;
    const customCtx = userContext.customSituation ? { customSituation: userContext.customSituation, customCounterpart: userContext.customCounterpart, customDesiredOutcome: userContext.customDesiredOutcome, customWorry: userContext.customWorry } : undefined;

    const presetPersona = clientPersona ? { name: clientPersona.name, role: clientPersona.role, company: clientPersona.company } : undefined;
    const scenarioFields = {
      currentSalary: userContext.currentSalary,
      targetSalary: userContext.targetSalary,
      achievement: userContext.achievement,
      targetRole: userContext.targetRole,
      decisionDescription: userContext.decisionDescription,
      alternative: userContext.alternative,
      feedbackReceived: userContext.feedbackReceived,
      counterEvidence: userContext.counterEvidence,
    };

    generatePersonaFromGroq(
      userContext.jobTitle, userContext.experience, userContext.industry,
      userContext.companySize, scenario.title, scenario.context,
      interviewCtx, customCtx, presetPersona, scenario.id, scenarioFields
    )
      .then((persona) => {
        setAiPersona(persona);
        setMessages([{ role: "ai", content: persona.openingMessage }]);
      })
      .catch(() => {
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

  const resetSession = () => {
    setMessages([]);
    setExchangeCount(0);
    setDimensionScores(createInitialDimensionScores());
    setCriteriaHistory({});
    setSessionComplete(false);
    setConversationComplete(false);
    setCompletionReason(null);
    setFinalVerdict(null);
    setShowContext(true);
    setCurrentFeedback(null);
    setExchangeDeltas([]);
    setExchangeSummaries([]);
    setPhaseHistory([]);
    setAiPersona(null);
    setUserContext(null);
    setClientPersona(null);
    setError(null);
    setShowScoreTooltip(false);
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping || sessionComplete || conversationComplete || !scenario || !userContext) return;

    const userMsg = input.trim();
    setInput("");
    setError(null);
    setCurrentFeedback(null);

    const newExchangeCount = exchangeCount + 1;
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setShowContext(false);
    setIsTyping(true);

    try {
      const groqMessages = [
        {
          role: "system" as const,
          content: buildSessionSystemPrompt(
            personaName, personaRole, personaCompany,
            userContext.jobTitle, userContext.experience,
            userContext.industry, userContext.companySize,
            newExchangeCount, scenario.context, scoringCriteria, score,
            userContext.resumeText ? { resumeText: userContext.resumeText, interviewRole: userContext.interviewRole, interviewMotivation: userContext.interviewMotivation, interviewType: userContext.interviewType } : undefined,
            userContext.customSituation ? { customSituation: userContext.customSituation, customCounterpart: userContext.customCounterpart, customDesiredOutcome: userContext.customDesiredOutcome, customWorry: userContext.customWorry } : undefined,
            scenario.id,
            {
              currentSalary: userContext.currentSalary,
              targetSalary: userContext.targetSalary,
              achievement: userContext.achievement,
              targetRole: userContext.targetRole,
              decisionDescription: userContext.decisionDescription,
              alternative: userContext.alternative,
              feedbackReceived: userContext.feedbackReceived,
              counterEvidence: userContext.counterEvidence,
            }
          ),
        },
        ...newMessages.map((m) => ({
          role: (m.role === "ai" ? "assistant" : "user") as "assistant" | "user",
          content: m.content,
        })),
      ];

      const raw = await callGroq(groqMessages, { maxTokens: 800 });
      const { content, scoreData } = parseSessionResponse(raw);

      if (scoreData) {
        const currentPhase = getConversationPhase(newExchangeCount, [...exchangeDeltas, scoreData.scoreDelta]);

        // Parse and apply dimension updates
        const dimUpdates = parseDimensionUpdates(scoreData);
        let newDimScores = dimensionScores;
        if (dimUpdates) {
          newDimScores = applyDimensionUpdates(dimensionScores, dimUpdates);
          setDimensionScores(newDimScores);
        }

        const newScore = computeOverallScore(newDimScores);

        if (scoreData.sessionTerminated) {
          const cappedScore = Math.min(35, newScore);
          setExchangeDeltas(prev => [...prev, scoreData.scoreDelta]);
          setExchangeSummaries(prev => [...prev, scoreData.roundSummary]);
          const newPhaseEntry: PhaseHistoryEntry = { phase: "Terminated", scoreDelta: scoreData.scoreDelta, summary: scoreData.roundSummary, userQuote: userMsg };
          const updatedPhaseHistory = [...phaseHistory, newPhaseEntry];
          setPhaseHistory(updatedPhaseHistory);
          setMessages(prev => [...prev, { role: "ai", content }]);
          setConversationComplete(true);
          setCompletionReason("terminated");
          setSessionComplete(true);

          setTimeout(() => {
            navigate("/debrief/session", {
              state: {
                messages: [...newMessages, { role: "ai", content }],
                score: cappedScore,
                dimensionScores: newDimScores,
                roundDeltas: [...exchangeDeltas, scoreData.scoreDelta],
                roundSummaries: [...exchangeSummaries, scoreData.roundSummary],
                phaseHistory: updatedPhaseHistory,
                scenarioId,
                scenarioTitle: scenario.title,
                personaName, personaRole, personaCompany,
                userContext, scoringCriteria,
                wasTerminated: true,
                terminationReason: scoreData.terminationReason || "Unprofessional conduct",
              },
            });
          }, 2000);

          setIsTyping(false);
          return;
        }

        setExchangeDeltas(prev => [...prev, scoreData.scoreDelta]);
        setExchangeSummaries(prev => [...prev, scoreData.roundSummary]);
        const newPhaseEntry: PhaseHistoryEntry = { phase: currentPhase, scoreDelta: scoreData.scoreDelta, summary: scoreData.roundSummary, userQuote: userMsg };
        setPhaseHistory(prev => [...prev, newPhaseEntry]);

        setCriteriaHistory(prev => {
          const next = { ...prev };
          for (const c of scoringCriteria) {
            if (!next[c.id]) next[c.id] = [];
            next[c.id] = [...next[c.id], scoreData.criteria?.[c.id] ?? false];
          }
          return next;
        });

        setCurrentFeedback({
          tags: scoreData.feedbackTags || [],
          scoreDelta: scoreData.scoreDelta,
          roundSummary: scoreData.roundSummary,
        });

        if (scoreData.conversationComplete) {
          setConversationComplete(true);
          setCompletionReason(scoreData.completionReason || "resolved");
          setFinalVerdict(scoreData.finalVerdict || null);
        }
      }

      setMessages(prev => [...prev, { role: "ai", content }]);
      setExchangeCount(newExchangeCount);
    } catch (err) {
      setError("The AI is taking a moment. Try sending again.");
      console.error("Groq error:", err);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, sessionComplete, conversationComplete, exchangeCount, score, messages, scenario, userContext, personaName, personaRole, personaCompany, scoringCriteria, dimensionScores, exchangeDeltas, exchangeSummaries, phaseHistory, navigate, scenarioId]);

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
        scenarioId={scenario.id}
        onStart={(ctx, persona) => {
          setUserContext(ctx);
          setClientPersona(persona);
        }}
      />
    );
  }

  const getCriteriaPct = (id: string) => {
    const history = criteriaHistory[id] || [];
    if (history.length === 0) return 0;
    return Math.round((history.filter(Boolean).length / history.length) * 100);
  };

  const handleViewDebrief = () => {
    const criteriaScoresMap: Record<string, number> = {};
    for (const c of scoringCriteria) {
      criteriaScoresMap[c.id] = getCriteriaPct(c.id);
    }

    navigate("/debrief/session", {
      state: {
        messages, score,
        dimensionScores,
        criteriaScores: criteriaScoresMap,
        roundDeltas: exchangeDeltas,
        roundSummaries: exchangeSummaries,
        phaseHistory,
        scenarioId,
        scenarioTitle: scenario.title,
        personaName, personaRole, personaCompany,
        userContext, scoringCriteria,
      },
    });
  };

  const hintIndex = Math.min(exchangeCount, coachHints.length - 1);
  const inputHintIndex = Math.min(exchangeCount, inputBarHints.length - 1);

  const contextCardText = buildContextCardText(scenario.id, userContext, personaName, personaRole, personaCompany);

  return (
    <div className="min-h-screen pt-16 flex flex-col" style={{ background: "#07080F" }}>
      {/* Top Bar */}
      <div className="h-12 flex items-center justify-between px-4 sm:px-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/scenarios")} className="p-1.5 rounded-lg text-pb-text-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-foreground">{scenario.emoji} {scenario.title}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${scenario.categoryColor}18`, color: scenario.categoryColor }}>
            {scenario.difficulty}
          </span>
        </div>
        <button onClick={() => navigate("/scenarios")} className="px-3 py-1.5 rounded-lg text-xs font-medium text-pb-text-secondary hover:text-foreground transition-colors" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
          End Session
        </button>
      </div>

      {/* Phase Bar */}
      <ConversationPhaseBar
        phase={phase}
        exchangeCount={exchangeCount}
        conversationComplete={conversationComplete}
        completionReason={completionReason}
      />

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
                  <p className="text-sm leading-relaxed" style={{ color: "#CBD5E1" }}>
                    {contextCardText}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs" style={{ color: "#94A3B8" }}>
                    <span>
                      {(scenario.id === "ace-your-next-interview" || scenario.id === "job-interview")
                        ? `${userContext.interviewType ? interviewTypeLabels[userContext.interviewType] + " · " : ""}${personaName} · ${personaCompany} · Interview in progress`
                        : (scenario.id === "practice-any-conversation" || scenario.id === "custom-situation")
                        ? `${personaName} · Conversation in progress`
                        : `${personaName} · ${personaCompany} · ${personaRole}`}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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

            {/* Conversation complete banner */}
            {conversationComplete && !sessionComplete && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4 px-6 rounded-xl" style={{ background: "rgba(61,214,140,0.06)", border: "1px solid rgba(61,214,140,0.15)" }}>
                <p className="text-sm font-semibold text-foreground mb-1">
                  {completionReason === "stalled" ? "Conversation ended — no further progress" : "Conversation complete"}
                </p>
                {finalVerdict && <p className="text-xs text-pb-text-secondary mb-3">{finalVerdict}</p>}
                <button
                  onClick={() => setSessionComplete(true)}
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground bg-gradient-primary hover:opacity-90 transition-opacity"
                >
                  View Results →
                </button>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center py-3 px-4 rounded-xl text-xs font-medium" style={{ background: "rgba(245,101,101,0.08)", color: "#F56565", border: "1px solid rgba(245,101,101,0.15)" }}>
                {error}
              </div>
            )}

            {/* Session complete */}
            {sessionComplete && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <SessionComplete
                  score={score}
                  scoreColor={scoreColor}
                  dimensionScores={dimensionScores}
                  criteriaHighlights={ALL_DIMENSION_IDS.map(id => ({
                    label: DIMENSION_LABELS[id],
                    pct: dimensionScores[id].score ?? 0,
                  }))}
                  onViewDebrief={handleViewDebrief}
                  onPracticeAgain={resetSession}
                />
              </motion.div>
            )}
          </div>

          {/* Input area */}
          {!sessionComplete && !conversationComplete && (
            <div className="p-4 sm:p-6" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs text-pb-text-muted mb-2">{coachHints[hintIndex] || ""}</p>
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
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-pb-text-muted">Enter to send · Shift+Enter for new line</p>
                <p className="text-xs" style={{ color: "#8891B4" }}>{inputBarHints[inputHintIndex] || ""}</p>
              </div>
            </div>
          )}
        </div>

        {/* Score Panel — Dimension-based */}
        <div className="w-full lg:w-[260px] p-4 sm:p-6 lg:border-l flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="lg:sticky lg:top-24">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-pb-text-muted">Session Score</p>
              <button
                onClick={() => setShowScoreTooltip(!showScoreTooltip)}
                className="text-pb-text-muted hover:text-foreground transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>

            {showScoreTooltip && (
              <div className="mb-3 p-3 rounded-lg text-xs leading-relaxed" style={{ background: "rgba(108,99,246,0.08)", border: "1px solid rgba(108,99,246,0.15)", color: "#CBD5E1" }}>
                Scores are based on communication behaviors demonstrated across the conversation, not just whether you got your desired outcome.
              </div>
            )}

            <div
              className="text-4xl font-bold tabular-nums mb-4"
              style={{ color: scoreColor, transition: "color 0.3s ease" }}
            >
              <span style={{ display: "inline-block", transition: "transform 0.3s ease" }}>{score}</span>
              <span className="text-lg text-pb-text-muted">/100</span>
            </div>

            {/* Dimension scores */}
            <div className="space-y-3.5">
              {ALL_DIMENSION_IDS.map((id) => {
                const dim = dimensionScores[id];
                const isAssessed = dim.score !== null;
                const dimScore = dim.score ?? 0;
                const color = getDimensionColor(dim.score);
                const weight = Math.round(DIMENSION_WEIGHTS[id] * 100);

                return (
                  <div key={id} title={DIMENSION_TOOLTIPS[id]}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: "#CBD5E1" }}>{DIMENSION_LABELS[id]}</span>
                      <div className="flex items-center gap-1.5">
                        {isAssessed ? (
                          <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{dimScore}</span>
                        ) : (
                          <span className="text-[10px] italic" style={{ color: "rgba(255,255,255,0.3)" }}>—</span>
                        )}
                        <span className="text-[9px] tabular-nums" style={{ color: "rgba(255,255,255,0.2)" }}>{weight}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      {isAssessed ? (
                        <div className="h-full rounded-full" style={{ width: `${dimScore}%`, background: color, transition: "width 0.5s ease, background 0.3s ease" }} />
                      ) : (
                        <div className="h-full rounded-full" style={{ width: "100%", background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 4px, transparent 4px, transparent 8px)" }} />
                      )}
                    </div>
                    {isAssessed && dim.explanation && dim.explanation !== "Not assessed yet" && (
                      <p className="text-[10px] mt-0.5 leading-tight" style={{ color: "#94A3B8" }}>{dim.explanation}</p>
                    )}
                    {!isAssessed && (
                      <p className="text-[10px] mt-0.5 italic" style={{ color: "rgba(255,255,255,0.25)" }}>Not assessed yet</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Coach Tip */}
            {currentFeedback?.roundSummary && (
              <div className="mt-4 p-3 rounded-xl text-xs leading-relaxed" style={{ background: "rgba(108,99,246,0.1)", borderLeft: "3px solid #6C63F6" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#7C6FF7" }}>Coach Tip</p>
                <p className="text-foreground">{currentFeedback.roundSummary}</p>
              </div>
            )}

            {/* Exchange history */}
            {exchangeDeltas.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-pb-text-muted mb-2">Exchanges</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {exchangeDeltas.map((d, i) => (
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
