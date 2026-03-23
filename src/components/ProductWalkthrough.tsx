import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowRight, TrendingUp, MessageSquare, Send, Briefcase, Building2, Clock, Users } from "lucide-react";

// ── Scene types ────────────────────────────────────────────────────
type Scene =
  | "homepage"
  | "scenario-select"
  | "setup-form"
  | "conversation"
  | "conversation-2"
  | "debrief"
  | "result"
  | "pause";

const SCENE_DURATIONS: Record<Scene, number> = {
  homepage: 2800,
  "scenario-select": 2800,
  "setup-form": 3000,
  conversation: 3500,
  "conversation-2": 3200,
  debrief: 3000,
  result: 3200,
  pause: 800,
};

// ── Animated counter ───────────────────────────────────────────────
function useCounter(target: number, duration: number, active: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) { setVal(0); return; }
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setVal(Math.round(t * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return val;
}

// ── Typewriter hook ────────────────────────────────────────────────
function useTypewriter(text: string, speed: number, active: boolean) {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (!active) { setTyped(""); return; }
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTyped(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed, active]);
  return typed;
}

// ── Cursor component ───────────────────────────────────────────────
function DemoCursor({ x, y, clicking }: { x: string; y: string; clicking?: boolean }) {
  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: x, top: y,
        transition: "all 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M5 3L19 12L12 13L9 20L5 3Z" fill="white" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
      </svg>
      {clicking && (
        <div
          className="absolute top-1 left-1 w-6 h-6 rounded-full"
          style={{
            background: "rgba(124,111,247,0.4)",
            animation: "cursor-click 0.4s ease-out forwards",
          }}
        />
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function ProductWalkthrough() {
  const [scene, setScene] = useState<Scene>("homepage");
  const [cursorPos, setCursorPos] = useState({ x: "50%", y: "50%" });
  const [clicking, setClicking] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const clickAt = useCallback((x: string, y: string) => {
    setCursorPos({ x, y });
    setTimeout(() => setClicking(true), 600);
    setTimeout(() => setClicking(false), 1000);
  }, []);

  const transitionTo = useCallback((next: Scene) => {
    setFadeIn(false);
    setTimeout(() => {
      setScene(next);
      setFadeIn(true);
    }, 300);
  }, []);

  const reset = useCallback(() => {
    setScene("homepage");
    setFadeIn(true);
    setCursorPos({ x: "50%", y: "50%" });
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    const scenes: Scene[] = [
      "homepage", "scenario-select", "setup-form",
      "conversation", "conversation-2", "debrief", "result", "pause"
    ];
    const idx = scenes.indexOf(scene);

    switch (scene) {
      case "homepage":
        setTimeout(() => clickAt("55%", "65%"), 800);
        break;
      case "scenario-select":
        setTimeout(() => clickAt("32%", "45%"), 800);
        break;
      case "setup-form":
        setTimeout(() => clickAt("50%", "85%"), 1500);
        break;
      case "conversation":
        setCursorPos({ x: "85%", y: "85%" });
        break;
      case "conversation-2":
        setCursorPos({ x: "85%", y: "85%" });
        break;
      case "debrief":
        setCursorPos({ x: "50%", y: "50%" });
        break;
      case "result":
        setTimeout(() => clickAt("50%", "75%"), 1500);
        break;
    }

    timerRef.current = setTimeout(() => {
      if (scene === "pause") {
        reset();
      } else {
        const next = scenes[idx + 1];
        if (next) transitionTo(next);
      }
    }, SCENE_DURATIONS[scene]);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [scene, isVisible, clickAt, transitionTo, reset]);

  useEffect(() => {
    if (isVisible) reset();
  }, [isVisible, reset]);

  const formText = useTypewriter("Product Designer", 40, scene === "setup-form");

  const userMsg = useTypewriter(
    "I've researched market rates and $95k reflects my impact on Q3 revenue.",
    25,
    scene === "conversation"
  );

  const debriefScore = useCounter(78, 1200, scene === "debrief" || scene === "result");
  const resultScore = useCounter(78, 800, scene === "result");

  return (
    <div ref={containerRef} className="relative">
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "hsl(228 33% 4%)" }}>
        {/* Browser bar */}
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "hsl(230 33% 7%)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#F56565" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#F5A623" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3DD68C" }} />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1 rounded-md text-[11px] text-muted-foreground" style={{ background: "rgba(255,255,255,0.04)" }}>
              preproom.app
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="relative overflow-hidden" style={{ height: "420px" }}>
          <DemoCursor x={cursorPos.x} y={cursorPos.y} clicking={clicking} />

          <div
            className="absolute inset-0"
            style={{
              opacity: fadeIn ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          >
            {scene === "homepage" && <SceneHomepage />}
            {scene === "scenario-select" && <SceneScenarioSelect />}
            {scene === "setup-form" && <SceneSetupForm typedText={formText} />}
            {scene === "conversation" && <SceneConversation userMsg={userMsg} />}
            {scene === "conversation-2" && <SceneConversation2 />}
            {scene === "debrief" && <SceneDebrief score={debriefScore} />}
            {scene === "result" && <SceneResult score={resultScore} />}
          </div>

          {/* Scene indicator dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-40">
            {["homepage", "scenario-select", "setup-form", "conversation", "conversation-2", "debrief", "result"].map((s) => (
              <div
                key={s}
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{
                  background: s === scene ? "#7C6FF7" : "rgba(255,255,255,0.15)",
                  transform: s === scene ? "scale(1.4)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Scene Components ───────────────────────────────────────────────

function SceneHomepage() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center relative">
      <div className="absolute inset-0 bg-hero-glow opacity-50" />
      <div className="relative z-10">
        <p className="text-[10px] text-muted-foreground mb-3 tracking-widest uppercase">Preproom</p>
        <h3 className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight mb-2 tracking-tight">
          Practice the conversation{" "}
          <span className="text-gradient-primary">you've been dreading.</span>
        </h3>
        <p className="text-xs text-muted-foreground mb-5 max-w-[340px] mx-auto">
          The AI plays your manager, interviewer, or client.
        </p>
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-primary-foreground bg-gradient-primary">
          Start practicing free <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}

function SceneScenarioSelect() {
  const scenarios = [
    { emoji: "💰", title: "Salary Negotiation", tag: "Hard", tagColor: "#F56565", catColor: "#F5A623", cat: "Negotiation", selected: true },
    { emoji: "📈", title: "Ask for a Promotion", tag: "Medium", tagColor: "#F5A623", catColor: "#3DD68C", cat: "Growth", selected: false },
    { emoji: "🤝", title: "Disagree with Manager", tag: "Hard", tagColor: "#F56565", catColor: "#5B8AF5", cat: "Conflict", selected: false },
  ];
  return (
    <div className="h-full px-6 py-5">
      <p className="text-xs text-muted-foreground mb-1">Choose a scenario</p>
      <h3 className="text-base font-bold text-foreground mb-4">Training scenarios</h3>
      <div className="grid grid-cols-3 gap-3">
        {scenarios.map((s, i) => (
          <div
            key={i}
            className="rounded-xl p-3 transition-all duration-500"
            style={{
              background: s.selected ? "rgba(124,111,247,0.08)" : "hsl(230 33% 9%)",
              border: s.selected ? "1px solid rgba(124,111,247,0.4)" : "1px solid rgba(255,255,255,0.06)",
              borderLeft: `4px solid ${s.catColor}`,
              transform: s.selected ? "scale(1.03)" : "scale(1)",
              boxShadow: s.selected ? "0 0 20px rgba(124,111,247,0.1)" : "none",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{s.emoji}</span>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  background: `${s.tagColor}18`,
                  color: s.tagColor,
                }}
              >
                {s.tag}
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground mb-1">{s.title}</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${s.catColor}18`, color: s.catColor }}>
              {s.cat}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <p className="text-[10px] text-muted-foreground">6 free scenarios · Unlimited with Pro</p>
      </div>
    </div>
  );
}

function SceneSetupForm({ typedText }: { typedText: string }) {
  return (
    <div className="h-full px-6 py-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">💰</span>
        <div>
          <h3 className="text-sm font-bold text-foreground">Salary Negotiation</h3>
          <p className="text-[10px] text-muted-foreground">Set up your scenario</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {/* Job title - matches actual form */}
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block flex items-center gap-1">
            <Briefcase className="w-2.5 h-2.5" /> Your current role
          </label>
          <div className="rounded-xl px-3 py-2 text-xs text-foreground" style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)" }}>
            {typedText}
            <span className="inline-block w-[1.5px] h-3 bg-foreground ml-0.5 animate-[blink_1s_steps(2)_infinite] align-text-bottom" />
          </div>
        </div>
        {/* Industry - matches actual form */}
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block flex items-center gap-1">
            <Building2 className="w-2.5 h-2.5" /> Industry
          </label>
          <div className="rounded-xl px-3 py-2 text-xs text-foreground" style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)" }}>
            Technology
          </div>
        </div>
        {/* Company size - matches actual form */}
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block flex items-center gap-1">
            <Users className="w-2.5 h-2.5" /> Company size
          </label>
          <div className="rounded-xl px-3 py-2 text-xs text-foreground" style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)" }}>
            Mid-size (50-500)
          </div>
        </div>
        {/* Experience - matches actual form */}
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> Experience
          </label>
          <div className="rounded-xl px-3 py-2 text-xs text-foreground" style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)" }}>
            3-5 years
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <div className="px-4 py-2 rounded-xl text-xs font-semibold text-primary-foreground bg-gradient-primary flex items-center gap-1.5">
          Start Session <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}

function SceneConversation({ userMsg }: { userMsg: string }) {
  return (
    <div className="h-full flex">
      {/* Chat area */}
      <div className="flex-1 flex flex-col px-4 py-3">
        {/* Top bar - matches Session.tsx */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button className="text-muted-foreground text-[10px]">←</button>
            <span className="text-xs font-semibold text-foreground">💰 Salary Negotiation</span>
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "rgba(245,101,101,0.12)", color: "#F56565" }}>Hard</span>
          </div>
          <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>End Session</span>
        </div>

        {/* Phase bar - matches ConversationPhaseBar */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-medium mb-2 self-start" style={{ background: "rgba(124,111,247,0.08)", color: "#7C6FF7" }}>
          <MessageSquare className="w-2 h-2" /> Opening
        </div>

        {/* Messages - matches Session.tsx exactly */}
        <div className="flex-1 space-y-2.5 overflow-hidden">
          {/* AI message */}
          <div className="flex gap-2 max-w-[90%]">
            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold" style={{ background: "rgba(245,101,101,0.15)", color: "#F56565" }}>
              SC
            </div>
            <div className="flex-1">
              <p className="text-[9px] text-muted-foreground mb-0.5">Sarah Chen — VP of Engineering</p>
              <div className="rounded-xl px-2.5 py-2 text-[10px] text-foreground leading-relaxed" style={{ background: "rgba(245,101,101,0.05)", border: "1px solid rgba(245,101,101,0.1)" }}>
                I appreciate you bringing this up. But a jump to $95k is significant. Our band for Senior tops out at $90k. What makes you think $95k is right?
              </div>
            </div>
          </div>

          {/* User message - matches Session.tsx */}
          <div className="flex gap-2 max-w-[90%] ml-auto flex-row-reverse">
            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold" style={{ background: "rgba(108,99,246,0.15)", color: "#7C6FF7" }}>
              Y
            </div>
            <div className="flex-1">
              <p className="text-[9px] text-muted-foreground mb-0.5 text-right">You</p>
              <div className="rounded-xl px-2.5 py-2 text-[10px] text-foreground leading-relaxed" style={{ background: "rgba(108,99,246,0.07)", border: "1px solid rgba(108,99,246,0.12)" }}>
                {userMsg}
                {userMsg.length < 70 && (
                  <span className="inline-block w-[1.5px] h-3 bg-foreground ml-0.5 animate-[blink_1s_steps(2)_infinite] align-text-bottom" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Input bar - matches Session.tsx */}
        <div className="mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[9px] text-muted-foreground mt-1.5 mb-1">Open by stating your position clearly and confidently.</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl px-2.5 py-1.5 text-[10px] text-muted-foreground" style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)" }}>
              Type your response...
            </div>
            <div className="px-2.5 py-1.5 rounded-xl text-[9px] font-semibold text-primary-foreground bg-gradient-primary flex items-center gap-1">
              Send <Send className="w-2 h-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Score panel - matches Session.tsx sidebar */}
      <div className="w-[130px] flex-shrink-0 px-3 py-3" style={{ borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Live Score</p>
        <div className="text-2xl font-bold tabular-nums mb-3" style={{ color: "#F5A623" }}>
          50<span className="text-[10px] text-muted-foreground">/100</span>
        </div>

        {/* Criteria bars - matches Session.tsx */}
        {[
          { label: "Clarity", pct: 0 },
          { label: "Confidence", pct: 0 },
          { label: "Evidence", pct: 0 },
          { label: "Strategy", pct: 0 },
          { label: "Composure", pct: 0 },
        ].map((c, i) => (
          <div key={i} className="mb-1.5">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[8px]" style={{ color: "#94A3B8" }}>{c.label}</span>
              <span className="text-[8px] tabular-nums" style={{ color: "rgba(255,255,255,0.3)" }}>{c.pct}%</span>
            </div>
            <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: "#F5A623" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneConversation2() {
  return (
    <div className="h-full flex">
      {/* Chat area */}
      <div className="flex-1 flex flex-col px-4 py-3">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button className="text-muted-foreground text-[10px]">←</button>
            <span className="text-xs font-semibold text-foreground">💰 Salary Negotiation</span>
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "rgba(245,101,101,0.12)", color: "#F56565" }}>Hard</span>
          </div>
          <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>End Session</span>
        </div>

        {/* Phase bar */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-medium mb-2 self-start" style={{ background: "rgba(245,166,35,0.08)", color: "#F5A623" }}>
          <TrendingUp className="w-2 h-2" /> Negotiating
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-2 overflow-hidden">
          {/* AI reply */}
          <div className="flex gap-2 max-w-[90%]">
            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold" style={{ background: "rgba(245,101,101,0.15)", color: "#F56565" }}>
              SC
            </div>
            <div className="flex-1">
              <p className="text-[9px] text-muted-foreground mb-0.5">Sarah Chen — VP of Engineering</p>
              <div className="rounded-xl px-2.5 py-2 text-[10px] text-foreground leading-relaxed" style={{ background: "rgba(245,101,101,0.05)", border: "1px solid rgba(245,101,101,0.1)" }}>
                That's fair — the market data is strong. Let me talk to HR. I can't promise $95k but I can push for $92k with a 6-month review. Does that work?
              </div>
            </div>
          </div>

          {/* Feedback strip - matches Session.tsx exactly */}
          <div className="flex items-center gap-1.5 flex-wrap py-1.5 px-2.5 rounded-xl animate-fade-in" style={{ background: "rgba(61,214,140,0.04)", border: "1px solid rgba(61,214,140,0.1)", animationDelay: "0.3s", animationFillMode: "both" }}>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(61,214,140,0.1)", color: "#3DD68C" }}>
              ✓ Referenced market data
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(61,214,140,0.1)", color: "#3DD68C" }}>
              ✓ Named specific number
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(245,166,35,0.1)", color: "#F5A623" }}>
              ⚠ Hold anchor firmer
            </span>
            <span className="text-[9px] font-bold ml-auto" style={{ color: "#3DD68C" }}>+18 pts</span>
          </div>
        </div>

        {/* Conversation ended banner - matches Session.tsx */}
        <div className="mt-2 py-2.5 px-3 rounded-xl text-center animate-fade-in" style={{ background: "rgba(61,214,140,0.06)", border: "1px solid rgba(61,214,140,0.15)", animationDelay: "1.5s", animationFillMode: "both" }}>
          <p className="text-[10px] font-semibold text-foreground mb-0.5">Conversation complete</p>
          <p className="text-[9px] text-muted-foreground mb-1.5">Manager agreed to review your compensation.</p>
          <span className="px-3 py-1 rounded-lg text-[9px] font-semibold text-primary-foreground bg-gradient-primary">View Results →</span>
        </div>
      </div>

      {/* Score panel - updated scores */}
      <div className="w-[130px] flex-shrink-0 px-3 py-3" style={{ borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Live Score</p>
        <div className="text-2xl font-bold tabular-nums mb-3" style={{ color: "#3DD68C" }}>
          78<span className="text-[10px] text-muted-foreground">/100</span>
        </div>

        {[
          { label: "Clarity", pct: 85, color: "#3DD68C" },
          { label: "Confidence", pct: 78, color: "#3DD68C" },
          { label: "Evidence", pct: 90, color: "#3DD68C" },
          { label: "Strategy", pct: 65, color: "#F5A623" },
          { label: "Composure", pct: 72, color: "#3DD68C" },
        ].map((c, i) => (
          <div key={i} className="mb-1.5">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[8px]" style={{ color: "#94A3B8" }}>{c.label}</span>
              <span className="text-[8px] font-medium tabular-nums" style={{ color: c.color }}>{c.pct}%</span>
            </div>
            <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color, transition: "width 0.5s ease" }} />
            </div>
          </div>
        ))}

        {/* Coach tip - matches Session.tsx */}
        <div className="mt-2 p-2 rounded-xl text-[8px] leading-relaxed animate-fade-in" style={{ background: "rgba(108,99,246,0.1)", borderLeft: "2px solid #6C63F6", animationDelay: "0.8s", animationFillMode: "both" }}>
          <p className="font-bold uppercase tracking-wider mb-0.5" style={{ color: "#7C6FF7" }}>Coach Tip</p>
          <p className="text-foreground">Strong anchor with market data. Probe for other levers before accepting.</p>
        </div>

        {/* Exchange dots - matches Session.tsx */}
        <div className="mt-2">
          <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Exchanges</p>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold" style={{ background: "rgba(245,166,35,0.15)", color: "#F5A623" }}>1</div>
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold" style={{ background: "rgba(61,214,140,0.15)", color: "#3DD68C" }}>2</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneDebrief({ score }: { score: number }) {
  const scoreColor = "#3DD68C";
  return (
    <div className="h-full px-5 py-4 overflow-hidden">
      {/* Header - matches Debrief.tsx */}
      <div className="text-center mb-3">
        <p className="text-[9px] text-muted-foreground mb-0.5">💰 Salary Negotiation</p>
        <h3 className="text-sm font-bold mb-2" style={{ color: "#F0F6FF" }}>Session Complete</h3>

        {/* Score ring - matches Debrief.tsx SVG */}
        <div className="relative w-16 h-16 mx-auto mb-1">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none" />
            <circle
              cx="50" cy="50" r="42"
              stroke={scoreColor}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 264} 264`}
              style={{ transition: "stroke-dasharray 1s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold tabular-nums" style={{ color: scoreColor }}>{score}</span>
          </div>
        </div>
      </div>

      {/* Criteria cards row - matches Debrief.tsx */}
      <div className="flex gap-1.5 mb-3 justify-center">
        {[
          { label: "Clarity", pct: 85 },
          { label: "Confidence", pct: 78 },
          { label: "Evidence", pct: 90 },
          { label: "Strategy", pct: 65 },
          { label: "Composure", pct: 72 },
        ].map((c, i) => {
          const color = c.pct >= 70 ? "#3DD68C" : c.pct >= 50 ? "#F5A623" : "#F56565";
          return (
            <div key={i} className="rounded-lg p-1.5 text-center" style={{ background: "hsl(230 33% 9%)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-xs font-bold tabular-nums" style={{ color }}>{c.pct}%</div>
              <div className="text-[7px]" style={{ color: "#CBD5E1" }}>{c.label}</div>
            </div>
          );
        })}
      </div>

      {/* Debrief cards - matches Debrief.tsx exactly */}
      <div className="space-y-2">
        {/* Strength card */}
        <div className="rounded-lg p-2.5 animate-fade-in" style={{ background: "rgba(61,214,140,0.05)", borderLeft: "3px solid #3DD68C", animationDelay: "0.3s", animationFillMode: "both" }}>
          <p className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#3DD68C" }}>🎯 Top Strength</p>
          <p className="text-[9px] italic mb-0.5" style={{ color: "#CBD5E1" }}>"I've researched market rates and $95k reflects my impact..."</p>
          <p className="text-[9px]" style={{ color: "#E2E8F0" }}>You anchored with data — strong opening move.</p>
        </div>

        {/* Mistake card */}
        <div className="rounded-lg p-2.5 animate-fade-in" style={{ background: "rgba(245,101,101,0.05)", borderLeft: "3px solid #F56565", animationDelay: "0.6s", animationFillMode: "both" }}>
          <p className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#F56565" }}>⚠ Biggest Mistake</p>
          <p className="text-[9px] italic mb-0.5" style={{ color: "#CBD5E1" }}>"Does that work?"</p>
          <p className="text-[9px]" style={{ color: "#E2E8F0" }}>Accepted the counteroffer too quickly without probing.</p>
        </div>

        {/* Better version card */}
        <div className="rounded-lg p-2.5 animate-fade-in" style={{ background: "rgba(124,111,247,0.05)", borderLeft: "3px solid #7C6FF7", animationDelay: "0.9s", animationFillMode: "both" }}>
          <p className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#7C6FF7" }}>💬 Better Version</p>
          <p className="text-[9px]" style={{ color: "#CBD5E1" }}>"I appreciate $92k — before I accept, can we discuss the review timeline and title change?"</p>
        </div>
      </div>
    </div>
  );
}

function SceneResult({ score }: { score: number }) {
  const scoreColor = "#3DD68C";
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (circumference * (score / 100));

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center relative">
      {/* Glow - matches SessionComplete */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-36 h-36 rounded-full" style={{ background: `radial-gradient(circle, ${scoreColor}15, transparent 70%)`, animation: "pulse-gentle 2s ease-in-out infinite" }} />
      </div>

      <div className="relative z-10">
        {/* Score ring - matches SessionComplete SVG */}
        <div className="relative w-24 h-24 mx-auto mb-3">
          <svg width="96" height="96" className="relative">
            <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle
              cx="48" cy="48" r="42" fill="none"
              stroke={scoreColor}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 48 48)"
              style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums" style={{ color: scoreColor }}>{score}</span>
            <span className="text-[9px] text-muted-foreground">/100</span>
          </div>
        </div>

        <p className="text-sm font-semibold text-foreground mb-1">Strong performance.</p>
        <p className="text-[10px] text-muted-foreground mb-4 max-w-[280px]">
          You anchored well with market data and held your position under pressure.
        </p>

        {/* Criteria pills - matches SessionComplete top 3 */}
        <div className="flex items-center gap-2 justify-center mb-4 flex-wrap">
          {[
            { label: "Evidence", pct: 90, color: "#3DD68C" },
            { label: "Clarity", pct: 85, color: "#3DD68C" },
            { label: "Confidence", pct: 78, color: "#3DD68C" },
          ].map((c, i) => (
            <div key={i} className="px-2.5 py-1.5 rounded-xl text-center" style={{ background: `${c.color}10`, border: `1px solid ${c.color}20` }}>
              <p className="text-[10px] font-medium" style={{ color: c.color }}>{c.pct}%</p>
              <p className="text-[8px]" style={{ color: "#94A3B8" }}>{c.label}</p>
            </div>
          ))}
        </div>

        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-primary-foreground bg-gradient-primary">
          View Full Debrief <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}
