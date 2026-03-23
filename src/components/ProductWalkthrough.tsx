import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Star, TrendingUp, MessageSquare, BarChart3 } from "lucide-react";

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

  // IntersectionObserver for autoplay on scroll
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

  // Scene sequencer
  useEffect(() => {
    if (!isVisible) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    const scenes: Scene[] = [
      "homepage", "scenario-select", "setup-form",
      "conversation", "conversation-2", "debrief", "result", "pause"
    ];
    const idx = scenes.indexOf(scene);

    // Cursor choreography per scene
    switch (scene) {
      case "homepage":
        setTimeout(() => clickAt("55%", "65%"), 800);
        break;
      case "scenario-select":
        setTimeout(() => clickAt("32%", "45%"), 800);
        break;
      case "setup-form":
        setTimeout(() => clickAt("50%", "78%"), 1500);
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

  // Restart when becomes visible
  useEffect(() => {
    if (isVisible) reset();
  }, [isVisible, reset]);

  const formText = useTypewriter(
    "Senior Product Designer → Lead",
    30,
    scene === "setup-form"
  );

  const userMsg = useTypewriter(
    "I've researched market rates and $95k reflects my impact on Q3 revenue.",
    25,
    scene === "conversation"
  );

  const debriefScore = useCounter(78, 1200, scene === "debrief" || scene === "result");
  const resultScore = useCounter(78, 800, scene === "result");

  return (
    <div ref={containerRef} className="relative">
      {/* Browser chrome frame */}
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
            {["homepage", "scenario-select", "setup-form", "conversation", "conversation-2", "debrief", "result"].map((s, i) => (
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
    { emoji: "💰", title: "Salary Negotiation", tag: "Hard", selected: true },
    { emoji: "📈", title: "Ask for a Promotion", tag: "Medium", selected: false },
    { emoji: "🤝", title: "Disagree with Manager", tag: "Hard", selected: false },
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
              transform: s.selected ? "scale(1.03)" : "scale(1)",
              boxShadow: s.selected ? "0 0 20px rgba(124,111,247,0.1)" : "none",
            }}
          >
            <span className="text-2xl block mb-2">{s.emoji}</span>
            <p className="text-xs font-semibold text-foreground mb-1">{s.title}</p>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{
                background: s.tag === "Hard" ? "rgba(245,101,101,0.1)" : "rgba(245,166,35,0.1)",
                color: s.tag === "Hard" ? "#F56565" : "#F5A623",
              }}
            >
              {s.tag}
            </span>
          </div>
        ))}
      </div>
      {/* Bottom hint */}
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
      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Your current role → target role</label>
          <div className="rounded-lg px-3 py-2 text-xs text-foreground" style={{ background: "hsl(232 28% 12%)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {typedText}
            <span className="inline-block w-[1.5px] h-3 bg-foreground ml-0.5 animate-[blink_1s_steps(2)_infinite] align-text-bottom" />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Current salary</label>
          <div className="rounded-lg px-3 py-2 text-xs text-foreground" style={{ background: "hsl(232 28% 12%)", border: "1px solid rgba(255,255,255,0.08)" }}>
            $82,000
          </div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Target salary</label>
          <div className="rounded-lg px-3 py-2 text-xs text-foreground" style={{ background: "hsl(232 28% 12%)", border: "1px solid rgba(255,255,255,0.08)" }}>
            $95,000
          </div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Company</label>
          <div className="rounded-lg px-3 py-2 text-xs text-foreground" style={{ background: "hsl(232 28% 12%)", border: "1px solid rgba(255,255,255,0.08)" }}>
            Meridian Analytics
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <div className="px-4 py-2 rounded-lg text-xs font-semibold text-primary-foreground bg-gradient-primary flex items-center gap-1.5">
          Start Session <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}

function SceneConversation({ userMsg }: { userMsg: string }) {
  return (
    <div className="h-full flex flex-col px-5 py-4">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "rgba(245,101,101,0.15)", color: "#F56565" }}>
            JR
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">James Rivera</p>
            <p className="text-[10px] text-muted-foreground">VP of Design · Meridian Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium" style={{ background: "rgba(124,111,247,0.08)", color: "#7C6FF7" }}>
          <MessageSquare className="w-2.5 h-2.5" /> Opening
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-hidden">
        {/* AI message */}
        <div className="flex gap-2 max-w-[88%]">
          <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold" style={{ background: "rgba(245,101,101,0.15)", color: "#F56565" }}>
            JR
          </div>
          <div className="rounded-xl px-3 py-2.5 text-[11px] text-foreground leading-relaxed" style={{ background: "rgba(245,101,101,0.06)", border: "1px solid rgba(245,101,101,0.1)" }}>
            I appreciate you bringing this up. But I want to be upfront — a jump to $95k is significant. Our band for Lead tops out at $90k. What makes you think $95k is the right number?
          </div>
        </div>

        {/* User message typing */}
        <div className="flex gap-2 max-w-[88%] ml-auto flex-row-reverse">
          <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold" style={{ background: "rgba(124,111,247,0.15)", color: "#7C6FF7" }}>
            Y
          </div>
          <div className="rounded-xl px-3 py-2.5 text-[11px] text-foreground leading-relaxed" style={{ background: "rgba(124,111,247,0.06)", border: "1px solid rgba(124,111,247,0.12)" }}>
            {userMsg}
            {userMsg.length < 70 && (
              <span className="inline-block w-[1.5px] h-3 bg-foreground ml-0.5 animate-[blink_1s_steps(2)_infinite] align-text-bottom" />
            )}
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "hsl(232 28% 12%)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-[11px] text-muted-foreground flex-1">Type your response…</span>
        <span className="px-3 py-1 rounded-md text-[10px] font-semibold text-primary-foreground bg-gradient-primary">Send</span>
      </div>
    </div>
  );
}

function SceneConversation2() {
  return (
    <div className="h-full flex flex-col px-5 py-4">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "rgba(245,101,101,0.15)", color: "#F56565" }}>
            JR
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">James Rivera</p>
            <p className="text-[10px] text-muted-foreground">VP of Design · Meridian Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium" style={{ background: "rgba(245,166,35,0.08)", color: "#F5A623" }}>
          <TrendingUp className="w-2.5 h-2.5" /> Negotiating
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-hidden">
        <div className="flex gap-2 max-w-[88%]">
          <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold" style={{ background: "rgba(245,101,101,0.15)", color: "#F56565" }}>
            JR
          </div>
          <div className="rounded-xl px-3 py-2.5 text-[11px] text-foreground leading-relaxed" style={{ background: "rgba(245,101,101,0.06)", border: "1px solid rgba(245,101,101,0.1)" }}>
            That's fair — the market data point is strong. Let me talk to HR. I can't promise $95k but I can push for $92k with a 6-month review. Does that work?
          </div>
        </div>

        {/* Coaching chips */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end pr-8">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium animate-fade-in" style={{ background: "rgba(61,214,140,0.1)", color: "#3DD68C", animationDelay: "0.5s", animationFillMode: "both" }}>
            ✓ Referenced market data
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium animate-fade-in" style={{ background: "rgba(61,214,140,0.1)", color: "#3DD68C", animationDelay: "0.7s", animationFillMode: "both" }}>
            ✓ Named specific number
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium animate-fade-in" style={{ background: "rgba(245,166,35,0.1)", color: "#F5A623", animationDelay: "0.9s", animationFillMode: "both" }}>
            ⚠ Hold anchor firmer
          </span>
        </div>

        {/* Score bump */}
        <div className="flex justify-end pr-8 animate-fade-in" style={{ animationDelay: "1.2s", animationFillMode: "both" }}>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(61,214,140,0.08)", color: "#3DD68C" }}>
            <TrendingUp className="w-2.5 h-2.5" /> 68 → 78
          </div>
        </div>
      </div>

      {/* Conversation ended banner */}
      <div className="mt-2 px-3 py-2 rounded-lg text-[10px] text-center font-medium animate-fade-in" style={{ background: "rgba(61,214,140,0.06)", color: "#3DD68C", border: "1px solid rgba(61,214,140,0.1)", animationDelay: "1.8s", animationFillMode: "both" }}>
        ✓ Conversation complete — View your AI debrief →
      </div>
    </div>
  );
}

function SceneDebrief({ score }: { score: number }) {
  return (
    <div className="h-full px-6 py-5 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">AI Debrief</p>
          <h3 className="text-sm font-bold text-foreground">Session Complete</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-bold tabular-nums" style={{ color: "#3DD68C" }}>{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      {/* Strength */}
      <div className="rounded-lg p-3 mb-2.5 animate-fade-in" style={{ background: "rgba(61,214,140,0.05)", borderLeft: "3px solid #3DD68C", animationDelay: "0.3s", animationFillMode: "both" }}>
        <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "#3DD68C" }}>Top Strength</p>
        <p className="text-[11px] text-foreground leading-relaxed italic">
          "You referenced specific market data and named $95k confidently — strong anchor."
        </p>
      </div>

      {/* Mistake */}
      <div className="rounded-lg p-3 mb-2.5 animate-fade-in" style={{ background: "rgba(245,101,101,0.05)", borderLeft: "3px solid #F56565", animationDelay: "0.6s", animationFillMode: "both" }}>
        <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "#F56565" }}>Biggest Mistake</p>
        <p className="text-[11px] text-foreground leading-relaxed italic">
          "You accepted the $92k counteroffer too quickly without probing for other levers."
        </p>
      </div>

      {/* Master version */}
      <div className="rounded-lg p-3 animate-fade-in" style={{ background: "rgba(124,111,247,0.05)", borderLeft: "3px solid #7C6FF7", animationDelay: "0.9s", animationFillMode: "both" }}>
        <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "#7C6FF7" }}>Better Version</p>
        <p className="text-[11px] text-foreground leading-relaxed">
          "I appreciate $92k — before I accept, can we also discuss the review timeline and title change?"
        </p>
      </div>
    </div>
  );
}

function SceneResult({ score }: { score: number }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center">
      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(124,111,247,0.12), transparent 70%)", animation: "pulse-gentle 2s ease-in-out infinite" }} />
      </div>

      <div className="relative z-10">
        {/* Score ring */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke="#3DD68C" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 264} 264`}
              style={{ transition: "stroke-dasharray 1s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold tabular-nums" style={{ color: "#3DD68C" }}>{score}</span>
          </div>
        </div>

        <p className="text-sm font-semibold text-foreground mb-1">Strong performance.</p>
        <p className="text-[11px] text-muted-foreground mb-5 max-w-[280px]">
          You anchored well with market data and held your position under pressure.
        </p>

        {/* Criteria pills */}
        <div className="flex items-center gap-2 justify-center mb-5 flex-wrap">
          {[
            { label: "Clarity", pct: 85 },
            { label: "Confidence", pct: 78 },
            { label: "Strategy", pct: 72 },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-foreground font-medium">{c.label}</span>
              <span className="font-bold" style={{ color: c.pct >= 75 ? "#3DD68C" : "#F5A623" }}>{c.pct}%</span>
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
