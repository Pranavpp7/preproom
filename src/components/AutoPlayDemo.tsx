import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────
type Phase =
  | "sarah1-typing"
  | "sarah1-msg"
  | "user-typing"
  | "user-msg"
  | "tags"
  | "sarah2-typing"
  | "sarah2-msg"
  | "banner"
  | "debrief"
  | "cta"
  | "pause";

interface Tag {
  label: string;
  color: "green" | "amber";
}

// ── Constants ──────────────────────────────────────────────────────
const SARAH_MSG_1 =
  "Look, I want to be honest with you — I think you've had a strong year. But $78k is a significant jump from $62k. Our standard band for mid-level analysts tops out at $71k, and I've already gone to bat for you with HR. I'm not sure I can push further than that.";

const USER_MSG =
  "I appreciate that — genuinely. But I've looked at market data from Levels.fyi, and mid-level analysts in this city range $74–82k. I also led the Q3 pipeline rebuild that cut reporting time by 40%. I think $78k reflects that fairly. Can we find a way to get there?";

const SARAH_MSG_2 =
  "That's a fair point on the market data — I hadn't seen those numbers. Let me go back to HR with that framing. I can't promise $78k today, but I can promise I'll push for it properly. Can you give me a week?";

const TAGS: Tag[] = [
  { label: "✓ Named a specific number", color: "green" },
  { label: "✓ Referenced market data", color: "green" },
  { label: "⚠ Could hold the anchor firmer", color: "amber" },
];

// ── Helpers ────────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(Math.round(t * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return value;
}

// ── Component ──────────────────────────────────────────────────────
export default function AutoPlayDemo() {
  const [phase, setPhase] = useState<Phase>("sarah1-typing");
  const [typedText, setTypedText] = useState("");
  const [visibleTags, setVisibleTags] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scoreActive =
    phase === "tags" ||
    phase === "sarah2-typing" ||
    phase === "sarah2-msg" ||
    phase === "banner" ||
    phase === "debrief" ||
    phase === "cta" ||
    phase === "pause";
  const score = useAnimatedCounter(68, 1200, scoreActive);

  const debriefScoreActive =
    phase === "debrief" || phase === "cta" || phase === "pause";
  const debriefScore = useAnimatedCounter(72, 1200, debriefScoreActive);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [phase, typedText, visibleTags]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // Reset for loop
  const reset = useCallback(() => {
    clearTimers();
    setPhase("sarah1-typing");
    setTypedText("");
    setVisibleTags(0);
    setShowBanner(false);
  }, [clearTimers]);

  // Main sequencer
  useEffect(() => {
    clearTimers();

    switch (phase) {
      case "sarah1-typing":
        timerRef.current = setTimeout(() => setPhase("sarah1-msg"), 1500);
        break;

      case "sarah1-msg":
        timerRef.current = setTimeout(() => setPhase("user-typing"), 1500);
        break;

      case "user-typing": {
        let i = 0;
        setTypedText("");
        intervalRef.current = setInterval(() => {
          i++;
          setTypedText(USER_MSG.slice(0, i));
          if (i >= USER_MSG.length) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            timerRef.current = setTimeout(() => setPhase("user-msg"), 400);
          }
        }, 40);
        break;
      }

      case "user-msg":
        timerRef.current = setTimeout(() => setPhase("tags"), 500);
        break;

      case "tags": {
        let t = 0;
        intervalRef.current = setInterval(() => {
          t++;
          setVisibleTags(t);
          if (t >= TAGS.length) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            timerRef.current = setTimeout(() => setPhase("sarah2-typing"), 1200);
          }
        }, 150);
        break;
      }

      case "sarah2-typing":
        timerRef.current = setTimeout(() => setPhase("sarah2-msg"), 1500);
        break;

      case "sarah2-msg":
        timerRef.current = setTimeout(() => {
          setShowBanner(true);
          setPhase("banner");
        }, 1500);
        break;

      case "banner":
        timerRef.current = setTimeout(() => setPhase("debrief"), 2000);
        break;

      case "debrief":
        timerRef.current = setTimeout(() => setPhase("cta"), 4000);
        break;

      case "cta":
        timerRef.current = setTimeout(() => setPhase("pause"), 3000);
        break;

      case "pause":
        timerRef.current = setTimeout(reset, 500);
        break;
    }

    return clearTimers;
  }, [phase, clearTimers, reset]);

  const isChat =
    phase !== "debrief" && phase !== "cta" && phase !== "pause";

  return (
    <div className="card-pb overflow-hidden relative">
      {/* ── Chat View ─────────────────────────── */}
      <div
        className="transition-opacity duration-700"
        style={{ opacity: isChat ? 1 : 0, pointerEvents: isChat ? "auto" : "none", position: isChat ? "relative" : "absolute", inset: isChat ? undefined : 0 }}
      >
        {/* Score badge top-right */}
        {scoreActive && (
          <div
            className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tabular-nums"
            style={{ background: "rgba(61,214,140,0.1)", color: "#3DD68C", border: "1px solid rgba(61,214,140,0.15)" }}
          >
            <span>{score}</span>
            <span className="font-normal text-muted-foreground">/100</span>
          </div>
        )}

        {/* Banner */}
        {showBanner && (
          <div
            className="mx-6 mt-4 px-4 py-2 rounded-lg text-xs font-medium text-center animate-fade-in"
            style={{ background: "rgba(245,166,35,0.08)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.15)" }}
          >
            ⚡ Round 4 of 6 — you're making progress
          </div>
        )}

        <div ref={chatRef} className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
          {/* Sarah message 1 */}
          {phase === "sarah1-typing" ? (
            <AiTyping />
          ) : (
            <AiMessage text={SARAH_MSG_1} />
          )}

          {/* User typing / message */}
          {(phase === "user-typing") && (
            <UserTypingBar text={typedText} />
          )}
          {["user-msg", "tags", "sarah2-typing", "sarah2-msg", "banner"].includes(phase) && (
            <>
              <UserMessage text={USER_MSG} />
              {visibleTags > 0 && (
                <div className="flex items-center gap-2 flex-wrap ml-auto max-w-[85%] pr-12" style={{ justifyContent: "flex-end" }}>
                  {TAGS.slice(0, visibleTags).map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full font-medium animate-fade-in"
                      style={
                        tag.color === "green"
                          ? { background: "rgba(61,214,140,0.1)", color: "#3DD68C" }
                          : { background: "rgba(245,166,35,0.1)", color: "#F5A623" }
                      }
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Sarah message 2 */}
          {phase === "sarah2-typing" && <AiTyping />}
          {["sarah2-msg", "banner"].includes(phase) && (
            <AiMessage text={SARAH_MSG_2} />
          )}
        </div>
      </div>

      {/* ── Debrief View ──────────────────────── */}
      <div
        className="transition-opacity duration-700"
        style={{ opacity: !isChat ? 1 : 0, pointerEvents: !isChat ? "auto" : "none", position: !isChat ? "relative" : "absolute", inset: !isChat ? undefined : 0 }}
      >
        <div className="p-6 space-y-5">
          {/* Score */}
          <div className="flex items-center gap-3 animate-fade-in">
            <span className="text-4xl font-bold tabular-nums" style={{ color: "#3DD68C" }}>{debriefScore}</span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>

          {/* Top Strength */}
          <div
            className="rounded-xl p-4 animate-fade-in"
            style={{ background: "rgba(61,214,140,0.06)", borderLeft: "4px solid #3DD68C", animationDelay: "0.3s", animationFillMode: "both" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#3DD68C" }}>Top Strength</p>
            <p className="text-sm text-foreground leading-relaxed italic">
              "You acknowledged the budget constraint before pushing back — that's exactly right."
            </p>
          </div>

          {/* Biggest Mistake */}
          <div
            className="rounded-xl p-4 animate-fade-in"
            style={{ background: "rgba(245,101,101,0.06)", borderLeft: "4px solid #F56565", animationDelay: "0.6s", animationFillMode: "both" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#F56565" }}>Biggest Mistake</p>
            <p className="text-sm text-foreground leading-relaxed italic">
              "In round 2 you said 'I was kind of thinking maybe $75k' — the word <span className="font-semibold">maybe</span> gave away your anchor immediately."
            </p>
          </div>

          {/* Master Response */}
          <div
            className="rounded-xl p-4 animate-fade-in"
            style={{ background: "rgba(108,99,246,0.06)", borderLeft: "4px solid #7C6FF7", animationDelay: "0.9s", animationFillMode: "both" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#7C6FF7" }}>How a strong negotiator would have said it</p>
            <p className="text-sm text-foreground leading-relaxed">
              "Based on market data for this role, $78k is the right number. I led the Q3 pipeline rebuild that saved 40% in reporting time — I'd like my comp to reflect that."
            </p>
          </div>

          {/* CTA */}
          {(phase === "cta" || phase === "pause") && (
            <div className="text-center pt-2 animate-fade-in">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-lg font-semibold text-primary-foreground bg-gradient-primary hover:opacity-90 transition-opacity animate-[pulse-gentle_2s_ease-in-out_infinite]"
              >
                Start your first session free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────
function AiAvatar() {
  return (
    <div
      className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
      style={{ background: "rgba(245,101,101,0.15)", color: "#F56565" }}
    >
      SC
    </div>
  );
}

function AiTyping() {
  return (
    <div className="flex gap-3 max-w-[85%] animate-fade-in">
      <AiAvatar />
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">Sarah Chen — Engineering Manager</p>
        <div
          className="rounded-xl px-5 py-4 flex items-center gap-1.5"
          style={{ background: "rgba(245,101,101,0.06)", border: "1px solid rgba(245,101,101,0.12)" }}
        >
          <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot-1" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot-2" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot-3" />
        </div>
      </div>
    </div>
  );
}

function AiMessage({ text }: { text: string }) {
  return (
    <div className="flex gap-3 max-w-[85%] animate-fade-in">
      <AiAvatar />
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">Sarah Chen — Engineering Manager</p>
        <div
          className="rounded-xl p-4 text-sm text-foreground leading-relaxed"
          style={{ background: "rgba(245,101,101,0.06)", border: "1px solid rgba(245,101,101,0.12)" }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

function UserTypingBar({ text }: { text: string }) {
  return (
    <div
      className="flex items-end gap-3 rounded-xl p-3 mx-0 animate-fade-in"
      style={{ background: "hsl(232 28% 12%)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex-1 text-sm text-foreground min-h-[36px] py-1.5">
        {text}
        <span className="inline-block w-[2px] h-4 bg-foreground ml-0.5 animate-[blink_1s_steps(2)_infinite] align-text-bottom" />
      </div>
      <span className="px-4 py-1.5 rounded-lg text-sm font-semibold text-primary-foreground bg-gradient-primary opacity-40 flex-shrink-0">
        Send →
      </span>
    </div>
  );
}

function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse animate-fade-in">
      <div
        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
        style={{ background: "rgba(108,99,246,0.15)", color: "#7C6FF7" }}
      >
        Y
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1.5 text-right">You</p>
        <div
          className="rounded-xl p-4 text-sm text-foreground leading-relaxed"
          style={{ background: "rgba(108,99,246,0.08)", border: "1px solid rgba(108,99,246,0.15)" }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
