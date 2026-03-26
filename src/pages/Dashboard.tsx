import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Flame, TrendingUp, Target, Trophy, ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import { getScoreColor } from "@/data/scenarios";
import { useAuth } from "@/lib/auth";
import { useMemo } from "react";

interface SessionRecord {
  scenarioId: string;
  scenarioTitle?: string;
  scenarioEmoji?: string;
  category?: string;
  score: number;
  completedAt: string;
  roundCount?: number;
  wasTerminated?: boolean;
}

function getSessionsFromStorage(): SessionRecord[] {
  try {
    return JSON.parse(localStorage.getItem("pb_sessions") || "[]");
  } catch { return []; }
}

function calculateStreak(sessions: SessionRecord[]): number {
  if (sessions.length === 0) return 0;
  const daySet = new Set(sessions.map(s => new Date(s.completedAt).toDateString()));
  let streak = 0;
  const d = new Date();
  while (true) {
    if (daySet.has(d.toDateString())) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export default function Dashboard() {
  const { user } = useAuth();
  const userName = user?.name?.split(' ')[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const sessions = useMemo(() => getSessionsFromStorage(), []);
  const hasSessions = sessions.length > 0;
  const streak = useMemo(() => calculateStreak(sessions), [sessions]);

  const avgScore = hasSessions
    ? Math.round(sessions.reduce((s, r) => s + r.score, 0) / sessions.length)
    : 0;

  const bestSession = hasSessions
    ? sessions.reduce((best, r) => r.score > best.score ? r : best, sessions[0])
    : null;

  // Build skill progress from real sessions grouped by category
  const skillMap = useMemo(() => {
    const map: Record<string, { name: string; scores: number[] }> = {};
    for (const s of sessions) {
      const cat = s.category || "General";
      if (!map[cat]) map[cat] = { name: cat, scores: [] };
      map[cat].scores.push(s.score);
    }
    const colors: Record<string, string> = {
      "Negotiation": "#7C6FF7", "Difficult Conversations": "#F56565",
      "Interviews": "#38BDF8", "Leadership": "#F5A623", "General": "#3DD68C",
    };
    return Object.values(map).map(m => ({
      name: m.name,
      color: colors[m.name] || "#7C6FF7",
      score: Math.round(m.scores.reduce((a, b) => a + b, 0) / m.scores.length),
      sessions: m.scores.length,
    }));
  }, [sessions]);

  // Recent sessions (last 3)
  const recentSessions = useMemo(() => {
    return sessions.slice(0, 3).map(s => ({
      emoji: s.scenarioEmoji || "📝",
      name: s.scenarioTitle || s.scenarioId,
      score: s.score,
      date: new Date(s.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      scenarioId: s.scenarioId,
    }));
  }, [sessions]);

  // Empty state
  if (!hasSessions) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1">{greeting}, {userName}</h1>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-pb p-10 text-center">
            <p className="text-lg font-semibold text-foreground mb-2">No sessions yet</p>
            <p className="text-sm text-pb-text-secondary mb-6">Your progress will appear here after your first practice.</p>
            <Link to="/scenarios" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground bg-gradient-primary hover:opacity-90 transition-opacity">
              Start practicing <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
        <div className="mt-16"><Footer /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1">{greeting}, {userName}</h1>
          <p className="text-pb-text-secondary text-sm">
            {streak === 0 ? "Start your streak today." :
             streak >= 7 ? "🔥 One week streak. You're building something real." :
             `${streak} days strong — keep going.`}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { icon: Target, label: "Sessions", value: sessions.length, color: "#7C6FF7" },
            { icon: Flame, label: "Streak", value: `${streak} 🔥`, color: "#F5A623" },
            { icon: TrendingUp, label: "Avg Score", value: avgScore, color: getScoreColor(avgScore) },
            { icon: Trophy, label: "Best", value: bestSession?.scenarioTitle?.split(" ")[0] || "—", color: "#3DD68C" },
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
        {skillMap.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-foreground mb-4">Skill Progress</h2>
            <div className="space-y-4">
              {skillMap.map(skill => (
                <div key={skill.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-foreground">{skill.name}</span>
                    <span className="text-xs text-pb-text-muted">{skill.score}% · {skill.sessions} sessions</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${skill.score}%` }} transition={{ duration: 0.8, delay: 0.2 }} style={{ background: skill.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-foreground mb-4">Recent Sessions</h2>
          <div className="space-y-2">
            {recentSessions.map((h, i) => (
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
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pro upsell */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card-pb p-6 text-center mb-16">
          <h3 className="text-lg font-bold text-foreground mb-2">Ready for more?</h3>
          <p className="text-sm text-pb-text-secondary mb-4">Unlimited scenarios · AI Coach · Voice input · Unlimited history</p>
          <Link to="/pricing" className="inline-flex px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors" style={{ color: "#7C6FF7", border: "1px solid rgba(108,99,246,0.3)" }}>
            Upgrade to Pro
          </Link>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
