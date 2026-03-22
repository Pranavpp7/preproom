import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import type { Scenario } from "@/data/scenarios";
import { getDifficultyColor } from "@/data/scenarios";

interface Props {
  scenario: Scenario;
}

export default function ScenarioCard({ scenario }: Props) {
  const { id, title, emoji, difficulty, duration, category, categoryColor, description, completions, locked } = scenario;

  if (locked) {
    return (
      <div className="card-pb relative overflow-hidden group cursor-pointer" style={{ borderLeft: `4px solid ${categoryColor}` }}>
        <div className="p-5 filter blur-[3px] select-none">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(56,189,248,0.12)", color: "#38BDF8", border: "1px solid rgba(56,189,248,0.25)" }}>Pro</span>
          </div>
          <h3 className="font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-pb-text-secondary line-clamp-2">{description}</p>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-pb-surface1/60">
          <Lock className="w-6 h-6 mb-2" style={{ color: "#38BDF8" }} />
          <Link to="/pricing" className="text-sm font-semibold hover:underline" style={{ color: "#38BDF8" }}>
            Unlock with Pro →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Link to={`/session/${id}`} className="card-pb-hover block" style={{ borderLeft: `4px solid ${categoryColor}` }}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl">{emoji}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${categoryColor}18`, color: categoryColor }}>{category}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${getDifficultyColor(difficulty)}18`, color: getDifficultyColor(difficulty) }}>{difficulty}</span>
          </div>
        </div>
        <h3 className="font-semibold text-foreground mb-1.5">{title}</h3>
        <p className="text-sm text-pb-text-secondary mb-3 line-clamp-2 leading-relaxed">{description}</p>
        <div className="flex items-center justify-between text-xs text-pb-text-muted">
          <span>⏱ {duration}</span>
          <span>{completions.toLocaleString()} completions</span>
        </div>
      </div>
    </Link>
  );
}
