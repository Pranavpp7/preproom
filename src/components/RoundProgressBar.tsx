import { Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getPhaseLabel } from "@/lib/groq";

const ROUND_TOOLTIPS: Record<number, string> = {
  1: "Opening — present your position",
  2: "Buildup — first constraint appears",
  3: "Escalation — new obstacle introduced",
  4: "Crisis point — hardest pushback",
  5: "Recovery — can you turn it around?",
  6: "Final decision — based on your performance",
};

interface RoundProgressBarProps {
  currentRound: number;
  sessionComplete: boolean;
}

export default function RoundProgressBar({ currentRound, sessionComplete }: RoundProgressBarProps) {
  const displayRound = Math.min(currentRound, 6);

  return (
    <div className="w-full px-4 sm:px-8 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between relative">
          {/* Connecting line */}
          <div className="absolute top-3 left-3 right-3 h-[2px]" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div
            className="absolute top-3 left-3 h-[2px] transition-all duration-500"
            style={{
              width: `${((Math.min(sessionComplete ? 6 : displayRound - 1, 5)) / 5) * (100 - 6)}%`,
              background: "linear-gradient(90deg, #3DD68C, #7C6FF7)",
            }}
          />

          <TooltipProvider delayDuration={200}>
            {[1, 2, 3, 4, 5, 6].map((r) => {
              const isCompleted = sessionComplete ? true : r < currentRound;
              const isCurrent = !sessionComplete && r === currentRound;
              const isUpcoming = !sessionComplete && r > currentRound;

              return (
                <Tooltip key={r}>
                  <TooltipTrigger asChild>
                    <div className="relative z-10 flex flex-col items-center">
                      {isCompleted ? (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#3DD68C" }}>
                          <Check className="w-3 h-3 text-black" strokeWidth={3} />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground animate-pulse" style={{ background: "#6C63F6", boxShadow: "0 0 12px rgba(108,99,246,0.5)" }}>
                          {r}
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium" style={{ border: "2px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.3)" }}>
                          {r}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  {isUpcoming && (
                    <TooltipContent side="bottom" className="text-xs max-w-[180px] text-center">
                      {ROUND_TOOLTIPS[r]}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>

        <p className="text-center text-xs font-medium mt-2" style={{ color: "#8891B4" }}>
          Round {displayRound} of 6
          <span className="mx-1">—</span>
          <span style={{ color: "#7C6FF7" }}>{getPhaseLabel(displayRound)}</span>
        </p>
      </div>
    </div>
  );
}
