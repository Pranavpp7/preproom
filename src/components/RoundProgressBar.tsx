interface ConversationPhaseBarProps {
  phase: string;
  exchangeCount: number;
  conversationComplete: boolean;
  completionReason?: string | null;
}

export default function ConversationPhaseBar({ phase, exchangeCount, conversationComplete, completionReason }: ConversationPhaseBarProps) {
  const phaseColor = phase === "Critical moment" ? "#F56565" : phase === "Wrapping up" ? "#F5A623" : "#7C6FF7";

  return (
    <div className="w-full px-4 sm:px-8 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="max-w-md mx-auto flex items-center justify-center gap-3">
        <div className="w-2 h-2 rounded-full" style={{ background: phaseColor, boxShadow: `0 0 8px ${phaseColor}60` }} />
        <p className="text-xs font-medium" style={{ color: "#8891B4" }}>
          {conversationComplete ? (
            <span style={{ color: completionReason === "terminated" ? "#F56565" : "#3DD68C" }}>
              {completionReason === "terminated" ? "Conversation terminated" : completionReason === "stalled" ? "Conversation ended — no progress" : "Conversation complete"}
            </span>
          ) : (
            <>
              <span style={{ color: phaseColor }}>{phase}</span>
              <span className="mx-1.5">·</span>
              <span>Exchange {exchangeCount}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
