import { useEffect, useState, useMemo } from "react";

interface CriteriaHighlight {
  label: string;
  pct: number;
}

interface SessionCompleteProps {
  score: number;
  scoreColor: string;
  criteriaHighlights: CriteriaHighlight[];
  onViewDebrief: () => void;
  onPracticeAgain: () => void;
}

export default function SessionComplete({ score, scoreColor, criteriaHighlights, onViewDebrief, onPracticeAgain }: SessionCompleteProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showContent, setShowContent] = useState(false);

  // Animate score count-up
  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / 1500, 1);
      setAnimatedScore(Math.round(t * score));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    setTimeout(() => setShowContent(true), 800);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const verdict = score >= 80 ? "Outstanding session." : score >= 65 ? "Strong performance." : score >= 50 ? "Solid effort — room to grow." : "Tough session. That's how you learn.";

  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (circumference * (animatedScore / 100));

  // Top 3 criteria
  const topCriteria = useMemo(() =>
    [...criteriaHighlights].sort((a, b) => b.pct - a.pct).slice(0, 3),
    [criteriaHighlights]
  );

  // Confetti particles
  const confettiParticles = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 1.5 + Math.random() * 1,
      color: ["#7C6FF7", "#5B8AF5", "#F5A623", "#3DD68C", "#06B6D4"][i % 5],
      size: 4 + Math.random() * 4,
    })),
    []
  );

  return (
    <div className="card-pb p-8 text-center relative overflow-hidden max-w-lg mx-auto">
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {confettiParticles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              top: "-8px",
              width: p.size,
              height: p.size,
              background: p.color,
              animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      {/* Score Ring */}
      <div className="relative inline-flex items-center justify-center mb-6">
        {/* Pulsing glow */}
        <div
          className="absolute w-36 h-36 rounded-full"
          style={{
            background: `radial-gradient(circle, ${scoreColor}15, transparent 70%)`,
            animation: "pulse-glow 2s ease-in-out infinite",
          }}
        />
        <svg width="140" height="140" className="relative">
          {/* Background circle */}
          <circle cx="70" cy="70" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          {/* Score arc */}
          <circle
            cx="70" cy="70" r="52" fill="none"
            stroke={scoreColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 70 70)"
            style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tabular-nums" style={{ color: scoreColor }}>{animatedScore}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      {/* Verdict */}
      <p className="text-lg font-semibold text-foreground mb-6">{verdict}</p>

      {/* Top 3 criteria highlights */}
      {showContent && topCriteria.length > 0 && (
        <div className="flex items-center justify-center gap-3 mb-8 flex-wrap animate-fade-in">
          {topCriteria.map((c, i) => {
            const color = c.pct > 60 ? "#3DD68C" : c.pct > 40 ? "#F5A623" : "#F56565";
            return (
              <div
                key={i}
                className="px-3 py-2 rounded-xl text-center"
                style={{ background: `${color}10`, border: `1px solid ${color}20` }}
              >
                <p className="text-xs font-medium" style={{ color }}>{c.pct}%</p>
                <p className="text-[11px] text-pb-text-secondary mt-0.5">{c.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onViewDebrief}
          className="px-8 py-3 rounded-lg text-sm font-semibold text-primary-foreground bg-gradient-primary hover:opacity-90 transition-opacity"
        >
          View Full Debrief →
        </button>
        <button
          onClick={onPracticeAgain}
          className="px-6 py-3 rounded-lg text-sm font-medium text-pb-text-secondary hover:text-foreground transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.12)" }}
        >
          Practice Again
        </button>
      </div>

      {/* CSS keyframes injected inline */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.05); opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}
