import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Flame, TrendingUp, Target, Trophy } from "lucide-react";
import Footer from "@/components/Footer";
import { getScoreColor, freeScenarios } from "@/data/scenarios";
import { useAuth } from "@/lib/auth";
const mockStats = { sessions: 12, streak: 3, avgScore: 71, bestScenario: "Salary Negotiation" };

const mockHistory = [
  { emoji: "🤝", name: "Salary Negotiation", score: 74, date: "Mar 20, 2026" },
  { emoji: "💬", name: "Disagree with Manager", score: 68, date: "Mar 19, 2026" },
  { emoji: "💼", name: "Job Interview", score: 82, date: "Mar 18, 2026" },
];

const mockSkills = [
  { name: "Negotiation", score: 72, sessions: 5, color: "#7C6FF7" },
  { name: "Difficult Conversations", score: 65, sessions: 4, color: "#F56565" },
  { name: "Interviews", score: 82, sessions: 3, color: "#38BDF8" },
  { name: "Leadership", score: 0, sessions: 0, color: "#F5A623" },
  { name: "Public Speaking", score: 0, sessions: 0, color: "#3DD68C" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const userName = user?.name?.split(' ')[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1">{greeting}, {userName}</h1>
          <p className="text-pb-text-secondary text-sm">
            {mockStats.streak === 0 ? "Start your streak today." :
             mockStats.streak >= 7 ? "🔥 One week streak. You're building something real." :
             `${mockStats.streak} days strong — keep going.`}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { icon: Target, label: "Sessions", value: mockStats.sessions, color: "#7C6FF7" },
            { icon: Flame, label: "Streak", value: `${mockStats.streak} 🔥`, color: "#F5A623" },
            { icon: TrendingUp, label: "Avg Score", value: mockStats.avgScore, color: getScoreColor(mockStats.avgScore) },
            { icon: Trophy, label: "Best", value: "Salary", color: "#3DD68C" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card-pb p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
                <span className="text-xs text-pb-text-muted">{s.label}</span>
              </div>
              <div className="text-xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Skill Progress */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-foreground mb-4">Skill Progress</h2>
          <div className="space-y-4">
            {mockSkills.map(skill => (
              <div key={skill.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">{skill.name}</span>
                  <span className="text-xs text-pb-text-muted">
                    {skill.sessions > 0 ? `${skill.score}% · ${skill.sessions} sessions` : "No sessions yet"}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${skill.score}%` }} transition={{ duration: 0.8, delay: 0.2 }} style={{ background: skill.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session History */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-foreground mb-4">Recent Sessions</h2>
          <div className="space-y-2">
            {mockHistory.map((h, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.06 }} className="card-pb flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{h.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{h.name}</p>
                    <p className="text-xs text-pb-text-muted">{h.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold tabular-nums" style={{ color: getScoreColor(h.score) }}>{h.score}</span>
                  <Link to={`/debrief/${h.name.toLowerCase().replace(/ /g, "-")}`} className="text-xs font-medium" style={{ color: "#7C6FF7" }}>View →</Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pro upsell */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card-pb p-6 text-center mb-16">
          <h3 className="text-lg font-bold text-foreground mb-2">Ready for more?</h3>
          <p className="text-sm text-pb-text-secondary mb-4">Unlimited scenarios · AI Coach · Certificates · Voice input</p>
          <Link to="/pricing" className="inline-flex px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors" style={{ color: "#7C6FF7", border: "1px solid rgba(108,99,246,0.3)" }}>
            Upgrade to Pro
          </Link>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
