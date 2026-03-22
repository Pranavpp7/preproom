import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import type { Scenario } from "@/data/scenarios";
import { getDifficultyColor } from "@/data/scenarios";

interface Props {
  scenario: Scenario;
}

export default function ScenarioCard({ scenario }: Props) {
  const { id, title, emoji, difficulty, duration, category, categoryColor, description, completions, locked, isCustom } = scenario;

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

  if (isCustom) {
    return (
      <Link to={`/session/${id}`} className="block group">
        <div
          className="relative rounded-xl p-[2px] transition-all hover:shadow-lg"
          style={{
            background: "linear-gradient(135deg, #7C6FF7, #06B6D4)",
          }}
        >
          <div className="rounded-[10px] p-5" style={{ background: "#0F1120" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(124,111,247,0.2), rgba(6,182,212,0.2))" }}>
                <Sparkles className="w-5 h-5" style={{ color: "#7C6FF7" }} />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "linear-gradient(135deg, rgba(124,111,247,0.15), rgba(6,182,212,0.15))", color: "#06B6D4", border: "1px solid rgba(6,182,212,0.25)" }}>
                Custom
              </span>
            </div>
            <h3 className="font-semibold text-foreground mb-1.5">{title}</h3>
            <p className="text-sm text-pb-text-secondary mb-3 line-clamp-2 leading-relaxed">{description}</p>
            <div className="text-xs text-pb-text-muted">
              Unlimited · Any situation
            </div>
            <div className="mt-3 text-xs font-semibold group-hover:underline" style={{ color: "#7C6FF7" }}>
              Describe your situation →
            </div>
          </div>
        </div>
      </Link>
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
