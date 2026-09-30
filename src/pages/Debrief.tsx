import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getScenarioById, getScoreColor, type ScoringCriterion } from "@/data/scenarios";
import { callGroq, buildDebriefPrompt } from "@/lib/groq";
import { useAuth } from "@/lib/auth";
import Footer from "@/components/Footer";
import {
  ALL_DIMENSION_IDS,
  DIMENSION_LABELS,
  DIMENSION_WEIGHTS,
  getDimensionColor,
  type DimensionScores,
} from "@/lib/scoring";

interface RoundBreakdownItem {
  round: number;
  scoreDelta: number;
  summary: string;
  userQuote?: string;
  verdict?: "strong" | "weak" | "neutral";
}

interface DebriefData {
  verdict: string;
  topStrength: { label: string; explanation: string; quote: string };
  biggestMistake: { label: string; quote: string; explanation: string; betterVersion: string };
  roundBreakdown: RoundBreakdownItem[];
  nextScenarioId: string;
  nextScenarioReason: string;
  whatWentWrong?: { trigger: string; explanation: string; betterApproach: string };
}

export default function Debrief() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = location.state as any;

  useEffect(() => {
    if (!user) navigate("/signin", { replace: true });
  }, [user, navigate]);

  const [debrief, setDebrief] = useState<DebriefData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState(false);

  const wasTerminated = state?.wasTerminated || false;
  const terminationReason = state?.terminationReason || "";
  const rawScore = state?.score || 0;
  const finalScore = wasTerminated ? Math.min(35, rawScore) : rawScore;
  const scenarioId = state?.scenarioId || "";
  const scenario = scenarioId ? getScenarioById(scenarioId) : null;
  const scoreColor = getScoreColor(finalScore);
  const messages = state?.messages || [];
  const personaName = state?.personaName || "";
  const personaRole = state?.personaRole || "";
  const personaCompany = state?.personaCompany || "";
  const userContext = state?.userContext;
  const criteriaScores: Record<string, number> = state?.criteriaScores || {};
  const dimensionScoresData: DimensionScores | undefined = state?.dimensionScores;
  const roundDeltas: number[] = state?.roundDeltas || [];
  const phaseHistory: { phase: string; scoreDelta: number; summary: string; userQuote: string }[] = state?.phaseHistory || [];
  const scoringCriteria: ScoringCriterion[] = state?.scoringCriteria || scenario?.scoringCriteria || [];

  // Score count-up animation
  useEffect(() => {
    let current = 0;
    const target = finalScore;
    const interval = setInterval(() => {
      current += 1;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setDisplayScore(current);
    }, 18);
    return () => clearInterval(interval);
  }, [finalScore]);

  const fetchDebrief = async (isRetry = false) => {
    if (messages.length === 0) {
      setIsLoading(false);
      setNoData(true);
      return;
    }

    if (isRetry) setIsRetrying(true);
    else setIsLoading(true);
    setError(null);

    try {
      const criteriaLabels = scoringCriteria.map((c) => c.label);
      const scenarioTitle = state?.scenarioTitle || scenario?.title || "Practice Session";

      const groqMessages = buildDebriefPrompt(
        messages,
        scenarioTitle,
        userContext?.jobTitle || "Professional",
        personaName,
        personaRole,
        personaCompany,
        finalScore,
        criteriaLabels,
        wasTerminated,
        terminationReason,
        userContext?.customSituation,
        phaseHistory
      );

      // Large coach JSON; raised for gpt-oss so the block is not truncated
      const raw = await callGroq(groqMessages, { temperature: 0.6, maxTokens: 2500 });
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        // If AI didn't return roundBreakdown but we have phaseHistory, build it from phaseHistory
        if ((!parsed.roundBreakdown || parsed.roundBreakdown.length === 0) && phaseHistory.length > 0) {
          parsed.roundBreakdown = phaseHistory.map((ph, i) => ({
            round: i + 1,
            scoreDelta: ph.scoreDelta,
            summary: ph.summary,
            userQuote: ph.userQuote,
            verdict: ph.scoreDelta >= 5 ? "strong" : ph.scoreDelta <= -5 ? "weak" : "neutral",
          }));
        }
        setDebrief(parsed);
      } else {
        throw new Error("Could not parse debrief");
      }
    } catch (err) {
      console.error("Debrief error:", err);
      setError("The AI is taking a moment — try again.");
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    fetchDebrief();
  }, []);

  // Save to localStorage and update streak
  useEffect(() => {
    if (!isLoading && debrief) {
      const session = {
        scenarioId,
        scenarioTitle: scenario?.title || scenarioId,
        scenarioEmoji: scenario?.emoji || "📝",
        category: scenario?.category || "General",
        score: finalScore,
        completedAt: new Date().toISOString(),
        roundCount: messages.filter((m: any) => m.role === "user").length,
        wasTerminated,
      };
      const history = JSON.parse(localStorage.getItem("pb_sessions") || "[]");
      history.unshift(session);
      localStorage.setItem("pb_sessions", JSON.stringify(history.slice(0, 20)));

      const storedUser = localStorage.getItem("pb_user");
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          const today = new Date().toDateString();
          const lastDate = u.lastSessionDate ? new Date(u.lastSessionDate).toDateString() : null;
          const yesterday = new Date(Date.now() - 86400000).toDateString();
          if (lastDate === today) { /* no change */ }
          else if (lastDate === yesterday) { u.streak = (u.streak || 0) + 1; }
          else { u.streak = 1; }
          u.lastSessionDate = new Date().toISOString();
          localStorage.setItem("pb_user", JSON.stringify(u));
        } catch {}
      }
    }
  }, [isLoading, debrief]);

  const nextScenario = debrief ? getScenarioById(debrief.nextScenarioId) : null;

  const getVerdictColor = (v?: string) => {
    if (v === "strong") return "#3DD68C";
    if (v === "weak") return "#F56565";
    return "#F5A623";
  };

  // Build round breakdown: prefer debrief AI data, fall back to phaseHistory
  const roundBreakdown: RoundBreakdownItem[] = debrief?.roundBreakdown && debrief.roundBreakdown.length > 0
    ? debrief.roundBreakdown
    : phaseHistory.map((ph, i) => ({
        round: i + 1,
        scoreDelta: ph.scoreDelta,
        summary: ph.summary,
        userQuote: ph.userQuote,
        verdict: (ph.scoreDelta >= 5 ? "strong" : ph.scoreDelta <= -5 ? "weak" : "neutral") as "strong" | "weak" | "neutral",
      }));

  if (noData) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center card-pb p-8 max-w-md mx-auto">
          <p className="text-lg font-bold mb-3" style={{ color: "#E2E8F0" }}>No conversation data found</p>
          <p className="text-sm mb-6" style={{ color: "#94A3B8" }}>Please complete a session first.</p>
          <Link to="/scenarios" className="px-6 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground bg-gradient-primary">
            Go to Scenarios →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <p className="text-sm mb-2" style={{ color: "#94A3B8" }}>{scenario?.emoji} {scenario?.title}</p>

          {wasTerminated ? (
            <h1 className="text-2xl font-bold mb-6" style={{ color: "#F56565" }}>Session Ended Early</h1>
          ) : (
            <h1 className="text-2xl font-bold mb-6" style={{ color: "#F0F6FF" }}>Session Complete</h1>
          )}

          {wasTerminated && (
            <p className="text-sm max-w-md mx-auto mb-6" style={{ color: "#94A3B8" }}>
              {personaName} ended this conversation due to {terminationReason.toLowerCase()}. In a real workplace, this conversation would have caused lasting damage to your professional relationship.
            </p>
          )}

          {/* Score ring */}
          <div className="relative w-32 h-32 mx-auto mb-2">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none" />
              <circle
                cx="50" cy="50" r="42"
                stroke={scoreColor}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(displayScore / 100) * 264} 264`}
                style={{ transition: "stroke-dasharray 0.1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold tabular-nums" style={{ color: scoreColor }}>{displayScore}</span>
            </div>
          </div>
          {wasTerminated && (
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Score capped at 35 due to early termination</p>
          )}
        </motion.div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card-pb p-6 animate-pulse">
                <div className="h-4 rounded-full w-1/3 mb-3" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="h-3 rounded-full w-full mb-2" style={{ background: "rgba(255,255,255,0.04)" }} />
                <div className="h-3 rounded-full w-2/3" style={{ background: "rgba(255,255,255,0.04)" }} />
              </div>
            ))}
          </div>
        )}

        {/* Dimension score cards */}
        {!isLoading && dimensionScoresData && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            {ALL_DIMENSION_IDS.map((id, i) => {
              const dim = dimensionScoresData[id];
              const isAssessed = dim.score !== null;
              const dimScore = dim.score ?? 0;
              const color = getDimensionColor(dim.score);
              const weight = Math.round(DIMENSION_WEIGHTS[id] * 100);
              return (
                <motion.div key={id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="card-pb p-4 text-center" title={dim.explanation}>
                  {isAssessed ? (
                    <div className="text-2xl font-bold tabular-nums mb-1" style={{ color }}>{dimScore}</div>
                  ) : (
                    <div className="text-lg font-medium mb-1 italic" style={{ color: "rgba(255,255,255,0.3)" }}>N/A</div>
                  )}
                  <div className="text-[11px] font-semibold" style={{ color: "#CBD5E1" }}>{DIMENSION_LABELS[id]}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{weight}% weight</div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Weighted score explanation */}
        {!isLoading && dimensionScoresData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mb-10 px-4 py-3 rounded-xl text-center" style={{ background: "rgba(108,99,246,0.05)", border: "1px solid rgba(108,99,246,0.1)" }}>
            <p className="text-[11px]" style={{ color: "#94A3B8" }}>
              Overall score is the weighted average of assessed dimensions. Scores reflect communication behaviors, not just whether you achieved your desired outcome.
            </p>
          </motion.div>
        )}

        {/* Fallback: old criteria cards if no dimension data */}
        {!isLoading && !dimensionScoresData && scoringCriteria.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
            {scoringCriteria.map((c, i) => {
              const pct = criteriaScores[c.id] ?? 0;
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="card-pb p-4 text-center" title={c.tooltip}>
                  <div className="text-2xl font-bold tabular-nums mb-1" style={{ color: getScoreColor(pct) }}>{pct}%</div>
                  <div className="text-xs font-semibold" style={{ color: "#CBD5E1" }}>{c.label}</div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Debrief content */}
        {!isLoading && debrief && (
          <>
            {/* What went wrong — termination card */}
            {wasTerminated && debrief.whatWentWrong && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-pb p-6 mb-6" style={{ borderLeft: "4px solid #F56565", background: "rgba(245,101,101,0.06)" }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: "#F56565" }}>🚫 What Went Wrong</h3>
                <p className="text-sm mb-2" style={{ color: "#E2E8F0" }}><span className="font-semibold">Trigger:</span> {debrief.whatWentWrong.trigger}</p>
                <p className="text-sm mb-3" style={{ color: "#94A3B8" }}>{debrief.whatWentWrong.explanation}</p>
                <div className="p-3 rounded-lg" style={{ background: "rgba(108,99,246,0.08)", borderLeft: "3px solid #6C63F6" }}>
                   <p className="text-xs uppercase font-bold mb-1" style={{ color: "#7C6FF7" }}>What to say instead</p>
                  <p className="text-sm italic" style={{ color: "#CBD5E1" }}>"{debrief.whatWentWrong.betterApproach}"</p>
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card-pb p-6 mb-6">
              <h2 className="text-lg font-bold mb-3" style={{ color: "#F0F6FF" }}>Verdict</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#E2E8F0" }}>{debrief.verdict}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card-pb p-6 mb-6" style={{ borderLeft: "4px solid #3DD68C" }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: "#3DD68C" }}>🎯 Top Strength: {debrief.topStrength.label}</h3>
              {debrief.topStrength.quote && (
                <p className="text-sm italic mb-2" style={{ color: "#CBD5E1" }}>"{debrief.topStrength.quote}"</p>
              )}
              <p className="text-sm leading-relaxed" style={{ color: "#E2E8F0" }}>{debrief.topStrength.explanation}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="card-pb p-6 mb-6" style={{ borderLeft: "4px solid #F56565" }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: "#F56565" }}>⚠ Biggest Mistake: {debrief.biggestMistake.label}</h3>
              <p className="text-sm italic mb-2" style={{ color: "#CBD5E1" }}>"{debrief.biggestMistake.quote}"</p>
              <p className="text-sm leading-relaxed" style={{ color: "#E2E8F0" }}>{debrief.biggestMistake.explanation}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="card-pb p-6 mb-6" style={{ borderLeft: "4px solid #7C6FF7" }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: "#F0F6FF" }}>💬 How a strong negotiator would have said it</h3>
              <p className="text-sm leading-relaxed italic" style={{ color: "#CBD5E1" }}>"{debrief.biggestMistake.betterVersion}"</p>
            </motion.div>

            {/* Round-by-round review — uses phaseHistory as fallback */}
            {roundBreakdown.length > 0 ? (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }} className="card-pb p-6 mb-6">
                <h3 className="text-sm font-bold mb-4" style={{ color: "#F0F6FF" }}>📊 Exchange-by-Exchange Review</h3>
                <div className="space-y-4">
                  {roundBreakdown.map((r) => {
                    const verdictColor = getVerdictColor(r.verdict);
                    return (
                      <div key={r.round} className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                          style={{
                            background: `${verdictColor}18`,
                            color: verdictColor,
                          }}
                        >
                          {r.round}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold tabular-nums" style={{ color: r.scoreDelta >= 0 ? "#3DD68C" : "#F56565" }}>
                              {r.scoreDelta > 0 ? "+" : ""}{r.scoreDelta}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${verdictColor}18`, color: verdictColor }}>
                              {r.verdict || "neutral"}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed mb-1" style={{ color: "#CBD5E1" }}>{r.summary}</p>
                          {r.userQuote && (
                            <p className="text-xs italic" style={{ color: "#94A3B8" }}>"{r.userQuote}"</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }} className="card-pb p-6 mb-6 text-center">
                <p className="text-sm" style={{ color: "#94A3B8" }}>Session too short for phase breakdown.</p>
              </motion.div>
            )}

            {nextScenario && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="card-pb-hover p-5 mb-10">
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#94A3B8" }}>Recommended Next</p>
                <Link to={`/session/${debrief.nextScenarioId}`} className="text-sm font-semibold hover:underline" style={{ color: "#E2E8F0" }}>
                  {nextScenario.emoji} {nextScenario.title} →
                </Link>
                <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{debrief.nextScenarioReason}</p>
              </motion.div>
            )}
          </>
        )}

        {error && (
          <div className="text-center py-4 px-6 rounded-xl text-sm mb-6" style={{ background: "rgba(245,101,101,0.08)", color: "#F56565", border: "1px solid rgba(245,101,101,0.15)" }}>
            <p className="mb-3">{error}</p>
            <button
              onClick={() => fetchDebrief(true)}
              disabled={isRetrying}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ border: "1px solid rgba(245,101,101,0.3)", background: "rgba(245,101,101,0.1)", color: "#E2E8F0" }}
            >
              {isRetrying ? "Retrying..." : "Regenerate debrief →"}
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          {scenarioId && (
            <Link to={`/session/${scenarioId}`} className="px-5 py-2.5 rounded-lg text-sm font-medium" style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#94A3B8" }}>
              Practice again
            </Link>
          )}
          {debrief?.nextScenarioId && (
            <Link to={`/session/${debrief.nextScenarioId}`} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground bg-gradient-primary">
              Try recommended →
            </Link>
          )}
          <Link to="/dashboard" className="px-5 py-2.5 rounded-lg text-sm font-medium" style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#94A3B8" }}>
            Go to dashboard
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
