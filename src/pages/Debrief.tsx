import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getScenarioById, getScoreColor } from "@/data/scenarios";
import Footer from "@/components/Footer";

const mockDebrief = {
  finalScore: 74,
  criteria: [
    { label: "Anchoring", score: 82, insight: "You stated your number early and confidently." },
    { label: "Evidence", score: 71, insight: "Used market data but could be more specific." },
    { label: "Composure", score: 85, insight: "Stayed calm even during the escalation." },
    { label: "Position", score: 58, insight: "Wobbled slightly when the budget freeze was mentioned." },
  ],
  verdict: "Strong performance overall. You showed real backbone when challenged, and your use of market data gave your position credibility. The main area for improvement is holding firm during crisis moments instead of immediately seeking compromise.",
  topStrength: { label: "Anchoring", explanation: 'You opened with "I think $78k is fair to both of us" — a clear, specific anchor that set the tone for the entire negotiation.' },
  biggestMistake: { label: "Premature Compromise", quote: "Would $74k work as a starting point?", explanation: "You offered to come down before she made a concrete counter. This signaled willingness to settle and weakened your position." },
  masterResponse: "I understand the budget constraints, Sarah, and I'm not asking you to break the system. But $78k isn't above market — it IS market for someone with my track record. Rather than me coming down, what if we structure this as $74k now with a written, guaranteed adjustment to $78k at my six-month review? That gives you time to make the case to HR with my next set of results as evidence.",
  whatToDoNextTime: [
    "Never be the first to suggest a lower number. Let the other side make the first concession.",
    "When you hear 'budget freeze' or 'policy,' ask 'What would need to happen for that to change?' instead of accepting it.",
    "Use silence after stating your position. Don't rush to fill the gap — let them respond to your number.",
  ],
  nextScenario: { id: "ask-for-promotion", reason: "You showed strong anchoring skills. Now practice turning vague promises into concrete commitments." },
};

export default function Debrief() {
  const { sessionId } = useParams();
  const scenario = getScenarioById(sessionId || "salary-negotiation");
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const target = mockDebrief.finalScore;
    let current = 0;
    const interval = setInterval(() => {
      current += 2;
      if (current >= target) { current = target; clearInterval(interval); }
      setDisplayScore(current);
    }, 20);
    return () => clearInterval(interval);
  }, []);

  const scoreColor = getScoreColor(mockDebrief.finalScore);

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
              <circle cx="50" cy="50" r="42" stroke={scoreColor} strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={`${(displayScore / 100) * 264} 264`} className="transition-all duration-100" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold tabular-nums" style={{ color: scoreColor }}>{displayScore}</span>
            </div>
          </div>
        </motion.div>

        {/* Criteria cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {mockDebrief.criteria.map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="card-pb p-4 text-center">
              <div className="text-2xl font-bold tabular-nums mb-1" style={{ color: getScoreColor(c.score) }}>{c.score}</div>
              <div className="text-xs font-semibold text-foreground mb-1">{c.label}</div>
              <div className="text-xs text-pb-text-muted leading-snug">{c.insight}</div>
            </motion.div>
          ))}
        </div>

        {/* Verdict */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card-pb p-6 mb-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Verdict</h2>
          <p className="text-sm text-pb-text-secondary leading-relaxed">{mockDebrief.verdict}</p>
        </motion.div>

        {/* Strength */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card-pb p-6 mb-6" style={{ borderLeft: "4px solid #3DD68C" }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: "#3DD68C" }}>🎯 Top Strength: {mockDebrief.topStrength.label}</h3>
          <p className="text-sm text-pb-text-secondary leading-relaxed">{mockDebrief.topStrength.explanation}</p>
        </motion.div>

        {/* Mistake */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="card-pb p-6 mb-6" style={{ borderLeft: "4px solid #F56565" }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: "#F56565" }}>⚠ Biggest Mistake: {mockDebrief.biggestMistake.label}</h3>
          <p className="text-sm italic text-foreground mb-2">"{mockDebrief.biggestMistake.quote}"</p>
          <p className="text-sm text-pb-text-secondary leading-relaxed">{mockDebrief.biggestMistake.explanation}</p>
        </motion.div>

        {/* Master response */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="card-pb p-6 mb-6" style={{ borderLeft: "4px solid #7C6FF7" }}>
          <h3 className="text-sm font-bold text-foreground mb-3">💬 How a strong negotiator would have said it</h3>
          <p className="text-sm text-foreground leading-relaxed italic">{mockDebrief.masterResponse}</p>
        </motion.div>

        {/* Next time */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="card-pb p-6 mb-10">
          <h3 className="text-sm font-bold text-foreground mb-3">📝 What to do next time</h3>
          <ol className="space-y-2.5">
            {mockDebrief.whatToDoNextTime.map((tip, i) => (
              <li key={i} className="flex gap-3 text-sm text-pb-text-secondary leading-relaxed">
                <span className="font-bold text-foreground flex-shrink-0">{i + 1}.</span>
                {tip}
              </li>
            ))}
          </ol>
        </motion.div>

        {/* Recommended next */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="card-pb-hover p-5 mb-10">
          <p className="text-xs text-pb-text-muted uppercase tracking-wider mb-2">Recommended Next</p>
          <Link to={`/session/${mockDebrief.nextScenario.id}`} className="text-sm font-semibold text-foreground hover:underline">
            ⬆️ Ask for a Promotion →
          </Link>
          <p className="text-xs text-pb-text-secondary mt-1">{mockDebrief.nextScenario.reason}</p>
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <Link to={`/session/${sessionId}`} className="px-5 py-2.5 rounded-lg text-sm font-medium text-pb-text-secondary" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
            Practice again
          </Link>
          <Link to={`/session/${mockDebrief.nextScenario.id}`} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground bg-gradient-primary">
            Try recommended →
          </Link>
          <Link to="/dashboard" className="px-5 py-2.5 rounded-lg text-sm font-medium text-pb-text-secondary" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
            Go to dashboard
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
