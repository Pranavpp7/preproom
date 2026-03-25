import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowRight, ArrowLeft, ArrowRight as ArrowRightIcon, TrendingUp, MessageSquare, Send, Briefcase, Building2, Clock, Users, ChevronLeft, ChevronRight } from "lucide-react";

// ── Scene types ────────────────────────────────────────────────────
type Scene =
  | "homepage"
  | "scenario-select"
  | "setup-form"
  | "conversation"
  | "session-complete"
  | "debrief"
  | "pause";

const SCENES: Scene[] = ["homepage", "scenario-select", "setup-form", "conversation", "session-complete", "debrief"];

const SCENE_DURATIONS: Record<Scene, number> = {
  homepage: 4000,
  "scenario-select": 4000,
  "setup-form": 4000,
  conversation: 4000,
  "session-complete": 4000,
  debrief: 4000,
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
  const [isPaused, setIsPaused] = useState(false);
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

  const goToScene = useCallback((target: Scene) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    transitionTo(target);
  }, [transitionTo]);

  const goNext = useCallback(() => {
    const idx = SCENES.indexOf(scene);
    if (idx < SCENES.length - 1) goToScene(SCENES[idx + 1]);
    else goToScene(SCENES[0]);
  }, [scene, goToScene]);

  const goPrev = useCallback(() => {
    const idx = SCENES.indexOf(scene);
    if (idx > 0) goToScene(SCENES[idx - 1]);
    else goToScene(SCENES[SCENES.length - 1]);
  }, [scene, goToScene]);

  // Auto-advance
  useEffect(() => {
    if (!isVisible || isPaused) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    const idx = SCENES.indexOf(scene);

    // Cursor choreography
    switch (scene) {
      case "homepage":
        setTimeout(() => clickAt("55%", "65%"), 800);
        break;
      case "scenario-select":
        setTimeout(() => clickAt("20%", "50%"), 800);
        break;
      case "setup-form":
        setTimeout(() => clickAt("50%", "88%"), 1500);
        break;
      case "conversation":
        setCursorPos({ x: "85%", y: "85%" });
        break;
      case "session-complete":
        setTimeout(() => clickAt("50%", "75%"), 1500);
        break;
      case "debrief":
        setCursorPos({ x: "50%", y: "50%" });
        break;
    }

    timerRef.current = setTimeout(() => {
      if (scene === "pause") {
        reset();
      } else {
        const next = idx < SCENES.length - 1 ? SCENES[idx + 1] : "pause" as Scene;
        if (next === "pause") {
          transitionTo("homepage" as Scene);
        } else {
          transitionTo(next);
        }
      }
    }, SCENE_DURATIONS[scene]);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [scene, isVisible, isPaused, clickAt, transitionTo, reset]);

  useEffect(() => {
    if (isVisible) reset();
  }, [isVisible, reset]);

  const formJobTitle = useTypewriter("Junior Data Analyst", 50, scene === "setup-form");

  const userMsg = useTypewriter(
    "I understand the band tops at $71k, but based on Levels.fyi data for this role in Chicago, the market range is $74-82k. I also led the Q3 pipeline rebuild that cut reporting time by 40%. I believe $78k reflects that fairly.",
    18,
    scene === "conversation"
  );

  const sessionScore = useCounter(72, 1200, scene === "session-complete" || scene === "debrief");
  const debriefScore = useCounter(72, 800, scene === "debrief");

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
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
            {scene === "setup-form" && <SceneSetupForm typedText={formJobTitle} />}
            {scene === "conversation" && <SceneConversation userMsg={userMsg} />}
            {scene === "session-complete" && <SceneSessionComplete score={sessionScore} />}
            {scene === "debrief" && <SceneDebrief score={debriefScore} />}
          </div>

          {/* Prev/Next arrows */}
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-40 w-7 h-7 rounded-full flex items-center justify-center transition-all opacity-0 hover:opacity-100 group-hover:opacity-70"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-40 w-7 h-7 rounded-full flex items-center justify-center transition-all opacity-0 hover:opacity-100 group-hover:opacity-70"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>

          {/* Scene indicator dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-40">
            {SCENES.map((s) => (
              <button
                key={s}
                onClick={() => goToScene(s)}
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
    { emoji: "🤝", title: "Salary Negotiation", tag: "Hard", tagColor: "#F56565", catColor: "#7C6FF7", cat: "Negotiation", selected: true },
    { emoji: "⬆️", title: "Ask for a Promotion", tag: "Medium", tagColor: "#F5A623", catColor: "#7C6FF7", cat: "Negotiation", selected: false },
    { emoji: "💬", title: "Challenge a Decision Professionally", tag: "Medium", tagColor: "#F5A623", catColor: "#F56565", cat: "Difficult", selected: false },
    { emoji: "📊", title: "Respond to Critical Feedback", tag: "Medium", tagColor: "#F5A623", catColor: "#F56565", cat: "Difficult", selected: false },
    { emoji: "💼", title: "Ace Your Next Interview", tag: "Beginner", tagColor: "#3DD68C", catColor: "#38BDF8", cat: "Interviews", selected: false },
    { emoji: "✦", title: "Practice Any Conversation", tag: "Adaptive", tagColor: "#06B6D4", catColor: "#06B6D4", cat: "Custom", selected: false },
  ];
  return (
    <div className="h-full px-6 py-5">
      <p className="text-xs text-muted-foreground mb-1">Choose a scenario</p>
      <h3 className="text-base font-bold text-foreground mb-4">Training scenarios</h3>
      <div className="grid grid-cols-3 gap-2">
        {scenarios.map((s, i) => (
          <div
            key={i}
            className="rounded-xl p-2.5 transition-all duration-500"
            style={{
              background: s.selected ? "rgba(124,111,247,0.08)" : "hsl(230 33% 9%)",
              border: s.selected ? "1px solid rgba(124,111,247,0.4)" : "1px solid rgba(255,255,255,0.06)",
              borderLeft: `3px solid ${s.catColor}`,
              transform: s.selected ? "scale(1.03)" : "scale(1)",
              boxShadow: s.selected ? "0 0 20px rgba(124,111,247,0.1)" : "none",
            }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-lg">{s.emoji}</span>
              <span
                className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  background: `${s.tagColor}18`,
                  color: s.tagColor,
                }}
              >
                {s.tag}
              </span>
            </div>
            <p className="text-[10px] font-semibold text-foreground leading-tight">{s.title}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 text-center">
        <p className="text-[10px] text-muted-foreground">6 free scenarios · Unlimited with Pro</p>
      </div>
    </div>
  );
}

function SceneSetupForm({ typedText }: { typedText: string }) {
  return (
    <div className="h-full px-6 py-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🤝</span>
        <div>
          <h3 className="text-sm font-bold text-foreground">Salary Negotiation</h3>
          <p className="text-[10px] text-muted-foreground">Set up your scenario</p>
        </div>
      </div>
      <div className="space-y-2.5">
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block flex items-center gap-1">
            <Briefcase className="w-2.5 h-2.5" /> Your current role
          </label>
          <div className="rounded-xl px-3 py-2 text-xs text-foreground" style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)" }}>
            {typedText}
            <span className="inline-block w-[1.5px] h-3 bg-foreground ml-0.5 animate-[blink_1s_steps(2)_infinite] align-text-bottom" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Current salary</label>
            <div className="rounded-xl px-3 py-2 text-xs text-foreground" style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)" }}>$62,000</div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Target salary</label>
            <div className="rounded-xl px-3 py-2 text-xs text-foreground" style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)" }}>$78,000</div>
          </div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Achievement</label>
          <div className="rounded-xl px-3 py-2 text-xs text-foreground" style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)" }}>Led Q3 pipeline rebuild, cut reporting time by 40%</div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block flex items-center gap-1">
            <Users className="w-2.5 h-2.5" /> Company size
          </label>
          <div className="rounded-xl px-3 py-2 text-xs text-foreground" style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)" }}>
            Mid-size (50-500)
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
        {/* Top bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button className="text-muted-foreground text-[10px]">←</button>
            <span className="text-xs font-semibold text-foreground">🤝 Salary Negotiation</span>
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "rgba(245,101,101,0.12)", color: "#F56565" }}>Hard</span>
          </div>
          <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>End Session</span>
        </div>

        {/* Phase bar */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-medium mb-2 self-start" style={{ background: "rgba(124,111,247,0.08)", color: "#7C6FF7" }}>
          <MessageSquare className="w-2 h-2" /> Opening
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-2.5 overflow-hidden">
          {/* AI message */}
          <div className="flex gap-2 max-w-[90%]">
            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold" style={{ background: "rgba(245,101,101,0.15)", color: "#F56565" }}>
              SC
            </div>
            <div className="flex-1">
              <p className="text-[9px] text-muted-foreground mb-0.5">Sarah Chen — Engineering Manager</p>
              <div className="rounded-xl px-2.5 py-2 text-[10px] text-foreground leading-relaxed" style={{ background: "rgba(245,101,101,0.05)", border: "1px solid rgba(245,101,101,0.1)" }}>
                Look, I want to be honest with you — I think you've had a strong year. But $78k is a significant jump from $62k. Our band tops out at $71k.
              </div>
            </div>
          </div>

          {/* User message */}
          <div className="flex gap-2 max-w-[90%] ml-auto flex-row-reverse">
            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold" style={{ background: "rgba(108,99,246,0.15)", color: "#7C6FF7" }}>
              Y
            </div>
            <div className="flex-1">
              <p className="text-[9px] text-muted-foreground mb-0.5 text-right">You</p>
              <div className="rounded-xl px-2.5 py-2 text-[10px] text-foreground leading-relaxed" style={{ background: "rgba(108,99,246,0.07)", border: "1px solid rgba(108,99,246,0.12)" }}>
                {userMsg}
                {userMsg.length < 200 && (
                  <span className="inline-block w-[1.5px] h-3 bg-foreground ml-0.5 animate-[blink_1s_steps(2)_infinite] align-text-bottom" />
                )}
              </div>
            </div>
          </div>

          {/* Feedback tags */}
          {userMsg.length >= 200 && (
            <div className="flex items-center gap-1.5 flex-wrap py-1.5 px-2.5 rounded-xl animate-fade-in" style={{ background: "rgba(61,214,140,0.04)", border: "1px solid rgba(61,214,140,0.1)" }}>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(61,214,140,0.1)", color: "#3DD68C" }}>✓ Named your number first</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(245,166,35,0.1)", color: "#F5A623" }}>⚠ Could back it up with data</span>
              <span className="text-[9px] font-bold ml-auto" style={{ color: "#3DD68C" }}>68/100</span>
            </div>
          )}
        </div>

        {/* Input bar */}
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

      {/* Score panel */}
      <div className="w-[130px] flex-shrink-0 px-3 py-3" style={{ borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Live Score</p>
        <div className="text-2xl font-bold tabular-nums mb-3" style={{ color: "#F5A623" }}>
          68<span className="text-[10px] text-muted-foreground">/100</span>
        </div>

        {[
          { label: "Named number", pct: 100 },
          { label: "Backed with data", pct: 50 },
          { label: "Confidence", pct: 70 },
          { label: "Composure", pct: 80 },
          { label: "Held position", pct: 60 },
        ].map((c, i) => (
          <div key={i} className="mb-1.5">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[8px]" style={{ color: "#94A3B8" }}>{c.label}</span>
              <span className="text-[8px] tabular-nums font-medium" style={{ color: c.pct >= 70 ? "#3DD68C" : "#F5A623" }}>{c.pct}%</span>
            </div>
            <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.pct >= 70 ? "#3DD68C" : "#F5A623" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneSessionComplete({ score }: { score: number }) {
  const scoreColor = "#3DD68C";
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (circumference * (score / 100));

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-36 h-36 rounded-full" style={{ background: `radial-gradient(circle, ${scoreColor}15, transparent 70%)`, animation: "pulse-gentle 2s ease-in-out infinite" }} />
      </div>

      <div className="relative z-10">
        {/* Score ring */}
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

        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-primary-foreground bg-gradient-primary">
          View Full Debrief <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}

function SceneDebrief({ score }: { score: number }) {
  const scoreColor = "#3DD68C";
  return (
    <div className="h-full px-5 py-4 overflow-hidden">
      {/* Header */}
      <div className="text-center mb-3">
        <p className="text-[9px] text-muted-foreground mb-0.5">🤝 Salary Negotiation</p>
        <h3 className="text-sm font-bold mb-2" style={{ color: "#F0F6FF" }}>Session Complete</h3>

        {/* Score ring */}
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

      {/* Verdict */}
      <div className="rounded-lg p-2 mb-2" style={{ background: "hsl(230 33% 9%)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#F0F6FF" }}>Verdict</p>
        <p className="text-[9px]" style={{ color: "#CBD5E1" }}>You opened strong with market data but accepted the counter too quickly.</p>
      </div>

      {/* Debrief cards */}
      <div className="space-y-2">
        <div className="rounded-lg p-2.5 animate-fade-in" style={{ background: "rgba(61,214,140,0.05)", borderLeft: "3px solid #3DD68C", animationDelay: "0.3s", animationFillMode: "both" }}>
          <p className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#3DD68C" }}>🎯 Top Strength</p>
          <p className="text-[9px] italic" style={{ color: "#CBD5E1" }}>"Referenced Levels.fyi data to anchor at $78k — strong opening move."</p>
        </div>

        <div className="rounded-lg p-2.5 animate-fade-in" style={{ background: "rgba(245,101,101,0.05)", borderLeft: "3px solid #F56565", animationDelay: "0.6s", animationFillMode: "both" }}>
          <p className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#F56565" }}>⚠ Biggest Mistake</p>
          <p className="text-[9px] italic" style={{ color: "#CBD5E1" }}>"I was kind of thinking maybe $75k" — the word <span className="font-semibold">maybe</span> gave away your anchor.</p>
        </div>

        <div className="rounded-lg p-2.5 animate-fade-in" style={{ background: "rgba(124,111,247,0.05)", borderLeft: "3px solid #7C6FF7", animationDelay: "0.9s", animationFillMode: "both" }}>
          <p className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#7C6FF7" }}>💬 How a strong negotiator would have said it</p>
          <p className="text-[9px]" style={{ color: "#CBD5E1" }}>"Based on market data, $78k is the right number. I led the Q3 rebuild that saved 40% in reporting time — I'd like my comp to reflect that."</p>
        </div>
      </div>
    </div>
  );
}
