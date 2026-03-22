import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getScenarioById, getScoreColor, type ScoringCriterion } from "@/data/scenarios";
import { callGroq, buildDebriefPrompt } from "@/lib/groq";
import { useAuth } from "@/lib/auth";
import Footer from "@/components/Footer";

interface DebriefData {
  verdict: string;
  topStrength: { label: string; explanation: string; quote: string };
  biggestMistake: { label: string; quote: string; explanation: string; betterVersion: string };
  roundBreakdown: { round: number; scoreDelta: number; summary: string }[];
  nextScenarioId: string;
  nextScenarioReason: string;
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

  const finalScore = state?.score || 72;
  const scenarioId = state?.scenarioId || "salary-negotiation";
  const scenario = getScenarioById(scenarioId);
  const scoreColor = getScoreColor(finalScore);
  const messages = state?.messages || [];
  const personaName = state?.personaName || "Sarah Chen";
  const personaRole = state?.personaRole || "Engineering Manager";
  const personaCompany = state?.personaCompany || "Meridian Analytics";
  const userContext = state?.userContext;
  const criteriaScores: Record<string, number> = state?.criteriaScores || {};
  const roundDeltas: number[] = state?.roundDeltas || [];
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
      return;
    }

    if (isRetry) setIsRetrying(true);
    else setIsLoading(true);
    setError(null);

    try {
      const criteriaLabels = scoringCriteria.map((c) => c.label);
      const groqMessages = buildDebriefPrompt(
        messages,
        scenario?.title || "Salary Negotiation",
        userContext?.jobTitle || "Professional",
        personaName,
        personaRole,
        personaCompany,
        finalScore,
        criteriaLabels
      );

      const raw = await callGroq(groqMessages, { temperature: 0.6, maxTokens: 800 });
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        setDebrief(JSON.parse(match[0]));
      } else {
        throw new Error("Could not parse debrief");
      }
    } catch (err) {
      console.error("Debrief error:", err);
      setError("The AI is taking a moment — try again.");
      if (!debrief) {
        setDebrief({
          verdict: "You demonstrated solid fundamentals in this session. Your approach showed awareness of the dynamics at play, though there were moments where more conviction would have strengthened your position.",
          topStrength: { label: "Composure", explanation: "You maintained a steady tone throughout the conversation.", quote: "Your responses stayed measured and professional." },
          biggestMistake: { label: "Hedging Language", quote: "Some of your phrasing softened your position unnecessarily.", explanation: "Using words like 'maybe' or 'kind of' signals uncertainty and weakens your negotiating position.", betterVersion: "State your position directly: 'Based on market data, the right number is $78k. My track record supports that.'" },
          roundBreakdown: roundDeltas.map((d: number, i: number) => ({ round: i + 1, scoreDelta: d, summary: `Round ${i + 1}` })),
          nextScenarioId: "ask-for-promotion",
          nextScenarioReason: "Practice turning vague promises into concrete commitments.",
        });
      }
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  // Fetch debrief from Groq
  useEffect(() => {
    fetchDebrief();
  }, []);

  // Save to localStorage and update streak
  useEffect(() => {
    if (!isLoading && debrief) {
      const session = {
        scenarioId,
        score: finalScore,
        completedAt: new Date().toISOString(),
        roundCount: 6,
      };
      const history = JSON.parse(localStorage.getItem("pb_sessions") || "[]");
      history.unshift(session);
      localStorage.setItem("pb_sessions", JSON.stringify(history.slice(0, 20)));

      // Update streak
      const storedUser = localStorage.getItem("pb_user");
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          const today = new Date().toDateString();
          const lastDate = u.lastSessionDate ? new Date(u.lastSessionDate).toDateString() : null;
          const yesterday = new Date(Date.now() - 86400000).toDateString();

          if (lastDate === today) {
            // Already played today, no change
          } else if (lastDate === yesterday) {
            u.streak = (u.streak || 0) + 1;
          } else {
            u.streak = 1;
          }
          u.lastSessionDate = new Date().toISOString();
          localStorage.setItem("pb_user", JSON.stringify(u));
        } catch {}
      }
    }
  }, [isLoading, debrief]);

  const nextScenario = debrief ? getScenarioById(debrief.nextScenarioId) : null;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <p className="text-sm text-pb-text-muted mb-2">{scenario?.emoji} {scenario?.title}</p>
          <h1 className="text-2xl font-bold text-foreground mb-6">Session Complete</h1>

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

        {/* Criteria cards */}
        {!isLoading && scoringCriteria.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
            {scoringCriteria.map((c, i) => {
              const pct = criteriaScores[c.id] ?? 0;
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="card-pb p-4 text-center" title={c.tooltip}>
                  <div className="text-2xl font-bold tabular-nums mb-1" style={{ color: getScoreColor(pct) }}>{pct}%</div>
                  <div className="text-xs font-semibold text-foreground">{c.label}</div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Debrief content */}
        {!isLoading && debrief && (
          <>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card-pb p-6 mb-6">
              <h2 className="text-lg font-bold text-foreground mb-3">Verdict</h2>
              <p className="text-sm text-pb-text-secondary leading-relaxed">{debrief.verdict}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card-pb p-6 mb-6" style={{ borderLeft: "4px solid #3DD68C" }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: "#3DD68C" }}>🎯 Top Strength: {debrief.topStrength.label}</h3>
              {debrief.topStrength.quote && (
                <p className="text-sm italic text-foreground mb-2">"{debrief.topStrength.quote}"</p>
              )}
              <p className="text-sm text-pb-text-secondary leading-relaxed">{debrief.topStrength.explanation}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="card-pb p-6 mb-6" style={{ borderLeft: "4px solid #F56565" }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: "#F56565" }}>⚠ Biggest Mistake: {debrief.biggestMistake.label}</h3>
              <p className="text-sm italic text-foreground mb-2">"{debrief.biggestMistake.quote}"</p>
              <p className="text-sm text-pb-text-secondary leading-relaxed">{debrief.biggestMistake.explanation}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="card-pb p-6 mb-6" style={{ borderLeft: "4px solid #7C6FF7" }}>
              <h3 className="text-sm font-bold text-foreground mb-3">💬 How a strong negotiator would have said it</h3>
              <p className="text-sm text-foreground leading-relaxed italic">"{debrief.biggestMistake.betterVersion}"</p>
            </motion.div>

            {debrief.roundBreakdown && debrief.roundBreakdown.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }} className="card-pb p-6 mb-6">
                <h3 className="text-sm font-bold text-foreground mb-4">📊 Round Breakdown</h3>
                <div className="flex items-center justify-center gap-3 mb-4">
                  {debrief.roundBreakdown.map((r) => (
                    <div
                      key={r.round}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: r.scoreDelta >= 10 ? "rgba(61,214,140,0.15)" : r.scoreDelta >= 0 ? "rgba(245,166,35,0.15)" : "rgba(245,101,101,0.15)",
                        color: r.scoreDelta >= 10 ? "#3DD68C" : r.scoreDelta >= 0 ? "#F5A623" : "#F56565",
                      }}
                    >
                      {r.round}
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {debrief.roundBreakdown.map((r) => (
                    <div key={r.round} className="flex items-start gap-3 text-xs">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{
                          background: r.scoreDelta >= 10 ? "rgba(61,214,140,0.15)" : r.scoreDelta >= 0 ? "rgba(245,166,35,0.15)" : "rgba(245,101,101,0.15)",
                          color: r.scoreDelta >= 10 ? "#3DD68C" : r.scoreDelta >= 0 ? "#F5A623" : "#F56565",
                        }}
                      >
                        {r.round}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold tabular-nums" style={{ color: r.scoreDelta >= 0 ? "#3DD68C" : "#F56565" }}>
                            {r.scoreDelta > 0 ? "+" : ""}{r.scoreDelta}
                          </span>
                        </div>
                        <span className="text-pb-text-secondary leading-relaxed">{r.summary}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {nextScenario && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="card-pb-hover p-5 mb-10">
                <p className="text-xs text-pb-text-muted uppercase tracking-wider mb-2">Recommended Next</p>
                <Link to={`/session/${debrief.nextScenarioId}`} className="text-sm font-semibold text-foreground hover:underline">
                  {nextScenario.emoji} {nextScenario.title} →
                </Link>
                <p className="text-xs text-pb-text-secondary mt-1">{debrief.nextScenarioReason}</p>
              </motion.div>
            )}
          </>
        )}

        {error && (
          <div className="text-center py-4 px-6 rounded-xl text-sm mb-6" style={{ background: "rgba(245,101,101,0.08)", color: "#F56565", border: "1px solid rgba(245,101,101,0.15)" }}>
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <Link to={`/session/${scenarioId}`} className="px-5 py-2.5 rounded-lg text-sm font-medium text-pb-text-secondary" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
            Practice again
          </Link>
          {debrief?.nextScenarioId && (
            <Link to={`/session/${debrief.nextScenarioId}`} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground bg-gradient-primary">
              Try recommended →
            </Link>
          )}
          <Link to="/dashboard" className="px-5 py-2.5 rounded-lg text-sm font-medium text-pb-text-secondary" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
            Go to dashboard
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
