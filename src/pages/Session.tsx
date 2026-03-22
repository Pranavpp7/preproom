import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, X } from "lucide-react";
import { getScenarioById, getScoreColor } from "@/data/scenarios";
import SessionContextForm, { type UserContext, type GeneratedPersona } from "@/components/SessionContextForm";

interface Message {
  role: "ai" | "user";
  content: string;
}

interface FeedbackTag {
  label: string;
  type: "good" | "warning";
}

interface RoundFeedback {
  tags: FeedbackTag[];
  scoreDelta: number;
  coachHint: string;
}

const mockAIResponses: Record<string, string[]> = {
  "salary-negotiation": [
    "Look, I want to be honest with you — I think you've had a strong year. But $78k is a significant jump from $62k. Our standard band for mid-level analysts tops out at $71k, and I've already gone to bat for you with HR. I'm not sure I can push further than that.",
    "I hear you on the market data, and I appreciate you doing your homework. But Meridian's compensation philosophy has always been about total comp — not just base. When you factor in our equity refresh and the bonus structure, you're already competitive. Are you sure base salary is the hill you want to die on here?",
    "Okay, I'm going to be direct with you. I just got out of a budget meeting, and finance has frozen all off-cycle adjustments above band. Even if I wanted to go to $78k, I literally cannot get it approved right now. The best I can do is $71k now with a guaranteed review in six months. Take it or leave it.",
    "You know what, I respect that you're not backing down. Let me ask you this — if I could get you to $74k now, with a written commitment to revisit at $78k in Q3 contingent on the metrics we discussed, would that work? I'd need you to help me build the case for HR.",
    "I think we can make something work. Let me be clear about what I can commit to today and what needs a timeline. I want to keep you here — you're too valuable to lose over a few thousand dollars.",
    "Alright, here's what I'm putting in writing: $74k effective immediately, with a performance-triggered adjustment to $78k at your six-month review based on the KPIs we'll define together this week. I think that's fair for both of us. Do we have a deal?",
  ],
  "ask-for-promotion": [
    "Hey, thanks for setting up this meeting. I know you've been eager to talk about your growth path. Before we dive in, I want you to know I think you've been doing really solid work. The Q4 campaign results were impressive.",
    "I hear you, and I don't disagree that you've earned more responsibility. The challenge is timing — we're in the middle of a reorg, and I don't want to put you up for a title change that gets caught in bureaucratic limbo. Can we revisit this in a couple months?",
    "Look, I'm going to level with you. The last two people I promoted at this level had been here at least 30 months. You're at 22. I'm not saying you're not ready — I'm saying the optics matter. HR will push back if I don't have a clear narrative.",
    "That's a fair point about your results. But I need you to understand — I have three other people on the team who also think they deserve a promotion. If I fast-track you, I have a morale problem. Help me understand why the timeline matters so much to you right now.",
    "Okay. You've made a compelling case. Here's what I can do — I'll draft the promotion packet this week, but I need you to document your key wins in a one-pager I can take to the leadership team. Can you get that to me by Friday?",
    "Consider it done. I'm putting the paperwork in motion. Realistically, you should see the title change and comp adjustment reflected within 4-6 weeks. I'll keep you posted on exactly where things stand each week.",
  ],
  "disagree-with-manager": [
    "Hey, come in. I wanted to talk through the timeline changes for Project Atlas. I've been looking at the schedule and I think we can ship two weeks earlier if we cut the user research phase. The engineering work is solid enough that we can iterate post-launch.",
    "I appreciate the concern, but we've shipped products without formal research before and they've done fine. The market window is closing — our competitor just announced a similar feature for Q2. Speed matters more than perfection here.",
    "I've been in this industry for 12 years. I've seen teams spend months on research only to build something that needed to change anyway once real users touched it. Sometimes you just need to ship and learn. Are you telling me our engineering team can't build something good without a research phase?",
    "Okay, I'm listening. But I need you to give me a concrete alternative that doesn't push our launch date. If you can show me a way to get meaningful user input without adding two weeks, I'm open to it. But 'we should do more research' isn't a plan — it's a stall.",
    "That's actually not a bad compromise. A focused three-day sprint with existing users could work. Draft me a plan with specific deliverables and I'll approve it. But if it slips even one day past the modified timeline, we ship without it. Deal?",
    "Good discussion. I'm glad you pushed back on this — you were right that we needed some user validation. Just make sure the research sprint is tight and actionable. I don't want a 50-page report — I want three clear insights we can act on.",
  ],
  "bad-performance-review": [
    "Thanks for coming in. I wanted to go over your performance review for this cycle. Overall, I've rated you at 'meets expectations.' I know that might not be what you were hoping to hear, but let me walk you through my reasoning.",
    "I understand you feel strongly about the Pinnacle and Westbrook accounts. And yes, the retention numbers were good. But performance isn't just about individual account results — it's about consistency across all your accounts and your contribution to team initiatives. Your participation in the mentorship program was minimal, and you missed two quarterly planning deadlines.",
    "I want to push back on that a little. The mentorship program is optional on paper, but it's a signal of growth and leadership potential. And the planning deadlines — even if the final work was solid — created downstream delays for the ops team. These things add up in a holistic review.",
    "Look, I'm not trying to dismiss your wins. The Pinnacle renewal was genuinely impressive — a 40% upsell is well above average. But I need to see that level of performance consistently, not just on your favorite accounts. What would you say about your smaller accounts this quarter?",
    "You make fair points. I think there may be some context I was missing about the Q3 workload distribution. Let me revisit the rating with this additional information. I'm not making any promises, but I want to be fair.",
    "Here's what I'll do — I'll submit a revised assessment that acknowledges the Pinnacle and Westbrook results more explicitly. I think 'exceeds expectations' in client management is warranted, with 'meets expectations' in team contribution. The blended rating should move up. I'll have the update to you by end of week.",
  ],
  "job-interview": [
    "Welcome, thanks for coming in. I'm Rachel Moore, Principal here at Vertex. I've been looking over your CV and I'm impressed by some of what I see. Before we get into the role specifics, I'd love to understand your career trajectory. I notice you've had two role changes in the past two years, and there's a four-month gap between your last two positions. Can you walk me through that?",
    "I appreciate the honesty. Let me ask you something more specific — in your last role, you mentioned leading a cross-functional initiative. Can you tell me about a time that initiative hit a major obstacle? What did you do, and what would you do differently if you could do it again?",
    "Good answer. Now, let's talk about this role specifically. The Senior Associate position requires managing client relationships independently — some of these clients are C-suite executives at Fortune 500 companies. Your experience seems more execution-focused. What makes you think you're ready for client-facing strategic work?",
    "Let me put you on the spot a little. You're in a meeting with a client CEO who just told you their board is questioning the ROI of your engagement. They're considering pulling the contract. What do you say in the next 60 seconds?",
    "Good composure under pressure. Last question before we talk logistics — what are your salary expectations for this role? And I should mention, we do have a defined band for this level.",
    "Thank you for a really strong conversation. I'm going to be direct — you're one of the strongest candidates we've spoken with. I'll need to sync with the team, but you should hear back from us within the week. Do you have any questions for me?",
  ],
};

const mockFeedback: RoundFeedback[] = [
  { tags: [{ label: "Strong opening", type: "good" }, { label: "Stated number", type: "good" }], scoreDelta: 14, coachHint: "Good start. Now back it up with evidence." },
  { tags: [{ label: "Used evidence", type: "good" }, { label: "Could be more specific", type: "warning" }], scoreDelta: 10, coachHint: "She's deflecting to total comp. Stay on base salary." },
  { tags: [{ label: "Held position", type: "good" }, { label: "Acknowledged constraint", type: "good" }, { label: "Could reframe timeline", type: "warning" }], scoreDelta: 16, coachHint: "This is the crisis point. Don't accept the freeze — ask about alternatives." },
  { tags: [{ label: "Good reframe", type: "good" }, { label: "Showed flexibility", type: "good" }], scoreDelta: 12, coachHint: "She's opening up. Push for written commitment." },
  { tags: [{ label: "Composure", type: "good" }, { label: "Specific ask", type: "good" }], scoreDelta: 8, coachHint: "You're close. Confirm the details in writing." },
  { tags: [{ label: "Strong close", type: "good" }], scoreDelta: 10, coachHint: "Session complete!" },
];

const roundHints = [
  "Tip: Open by stating your number confidently. Don't ask — tell.",
  "Tip: She's deflecting. Redirect to your specific market data.",
  "Tip: She's using a budget ceiling. Ask about timing, not permission.",
  "Tip: This is the crisis point. Don't back down — reframe instead.",
  "Tip: Push for specific written commitments with dates.",
  "Tip: Confirm everything. Summarize what was agreed.",
];

export default function Session() {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const scenario = getScenarioById(scenarioId || "");
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [dynamicPersona, setDynamicPersona] = useState<GeneratedPersona | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [criteriaScores, setCriteriaScores] = useState<number[]>([0, 0, 0, 0, 0]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<RoundFeedback | null>(null);
  const [showContext, setShowContext] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const activePersona = dynamicPersona || scenario?.persona || { name: "Manager", role: "Manager", company: "Company", initials: "M" };

  const aiResponses = mockAIResponses[scenarioId || "salary-negotiation"] || mockAIResponses["salary-negotiation"];

  // Start with AI's first message
  useEffect(() => {
    if (messages.length === 0) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setMessages([{ role: "ai", content: aiResponses[0] }]);
        setIsTyping(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isTyping || sessionComplete) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setShowContext(false);

    // Show feedback
    const fb = mockFeedback[round - 1] || mockFeedback[0];
    setCurrentFeedback(fb);
    const newScore = Math.min(100, score + fb.scoreDelta);
    setScore(newScore);
    setCriteriaScores(prev => prev.map((v, i) => Math.min(100, v + Math.floor(Math.random() * 20 + 5))));

    // AI response
    setTimeout(() => {
      setCurrentFeedback(null);
      if (round >= 6) {
        setSessionComplete(true);
        return;
      }
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "ai", content: aiResponses[round] || "That's a good point. Let me think about that..." }]);
        setIsTyping(false);
        setRound(r => r + 1);
      }, 1200 + Math.random() * 800);
    }, 1500);
  }, [input, isTyping, sessionComplete, round, score, aiResponses]);

  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Scenario not found</h1>
          <Link to="/scenarios" className="text-sm font-medium" style={{ color: "#7C6FF7" }}>← Back to scenarios</Link>
        </div>
      </div>
    );
  }

  const scoreColor = getScoreColor(score);

  return (
    <div className="min-h-screen pt-16 flex flex-col" style={{ background: "#07080F" }}>
      {/* Top Bar */}
      <div className="h-14 flex items-center justify-between px-4 sm:px-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/scenarios")} className="p-1.5 rounded-lg text-pb-text-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-foreground">{scenario.emoji} {scenario.title}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${scenario.categoryColor}18`, color: scenario.categoryColor }}>
            {scenario.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Round dots */}
          <div className="hidden sm:flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6].map(r => (
              <div key={r} className="w-2 h-2 rounded-full transition-colors" style={{ background: r <= round ? "#7C6FF7" : "rgba(255,255,255,0.15)" }} />
            ))}
            <span className="text-xs text-pb-text-muted ml-2">Round {round}/6</span>
          </div>
          <button onClick={() => navigate("/scenarios")} className="px-3 py-1.5 rounded-lg text-xs font-medium text-pb-text-secondary hover:text-foreground transition-colors" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
            End Session
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Context card */}
            <AnimatePresence>
              {showContext && (
                <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="card-pb p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-pb-text-muted">Scenario Context</span>
                    <button onClick={() => setShowContext(false)} className="text-pb-text-muted hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  <p className="text-sm text-pb-text-secondary leading-relaxed">{scenario.context}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-pb-text-muted">
                    <span>🏢 {scenario.persona.company}</span>
                    <span>🗣️ {scenario.persona.name}, {scenario.persona.role}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Escalation banner */}
            {round >= 3 && round <= 4 && messages.length > 2 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-2 px-4 rounded-lg text-xs font-semibold" style={{ background: "rgba(245,166,35,0.08)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.15)" }}>
                ⚡ Escalation — {scenario.persona.name.split(" ")[0]} just raised the stakes
              </motion.div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === "user" ? "max-w-[85%] ml-auto flex-row-reverse" : "max-w-[85%]"}`}>
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={msg.role === "ai" ? { background: "rgba(245,101,101,0.15)", color: "#F56565" } : { background: "rgba(108,99,246,0.15)", color: "#7C6FF7" }}>
                  {msg.role === "ai" ? scenario.persona.initials : "Y"}
                </div>
                <div className="flex-1">
                  <p className={`text-xs text-pb-text-muted mb-1 ${msg.role === "user" ? "text-right" : ""}`}>
                    {msg.role === "ai" ? `${scenario.persona.name} — ${scenario.persona.role}` : "You"}
                  </p>
                  <div className="rounded-xl p-3.5 text-sm text-foreground leading-relaxed" style={msg.role === "ai" ? { background: "rgba(245,101,101,0.05)", border: "1px solid rgba(245,101,101,0.1)" } : { background: "rgba(108,99,246,0.07)", border: "1px solid rgba(108,99,246,0.12)" }}>
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: "rgba(245,101,101,0.15)", color: "#F56565" }}>
                  {scenario.persona.initials}
                </div>
                <div className="rounded-xl p-4 flex items-center gap-1.5" style={{ background: "rgba(245,101,101,0.05)", border: "1px solid rgba(245,101,101,0.1)" }}>
                  <div className="w-2 h-2 rounded-full bg-pb-text-muted typing-dot-1" />
                  <div className="w-2 h-2 rounded-full bg-pb-text-muted typing-dot-2" />
                  <div className="w-2 h-2 rounded-full bg-pb-text-muted typing-dot-3" />
                </div>
              </div>
            )}

            {/* Feedback strip */}
            <AnimatePresence>
              {currentFeedback && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 flex-wrap py-2 px-3 rounded-xl" style={{ background: "rgba(61,214,140,0.04)", border: "1px solid rgba(61,214,140,0.1)" }}>
                  {currentFeedback.tags.map((t, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: t.type === "good" ? "rgba(61,214,140,0.1)" : "rgba(245,166,35,0.1)", color: t.type === "good" ? "#3DD68C" : "#F5A623" }}>
                      {t.type === "good" ? "✓" : "⚠"} {t.label}
                    </span>
                  ))}
                  <span className="text-xs font-bold ml-auto" style={{ color: currentFeedback.scoreDelta > 0 ? "#3DD68C" : "#F56565" }}>
                    {currentFeedback.scoreDelta > 0 ? "+" : ""}{currentFeedback.scoreDelta} pts
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Session complete */}
            {sessionComplete && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-pb p-6 text-center">
                <h3 className="text-xl font-bold text-foreground mb-2">Session Complete</h3>
                <div className="text-5xl font-bold tabular-nums mb-2" style={{ color: scoreColor }}>{score}</div>
                <p className="text-sm text-pb-text-secondary mb-6">Final Score</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link to={`/debrief/${scenarioId}`} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground bg-gradient-primary">
                    View Debrief →
                  </Link>
                  <button onClick={() => { setMessages([]); setRound(1); setScore(0); setCriteriaScores([0,0,0,0,0]); setSessionComplete(false); setShowContext(true); }} className="px-6 py-2.5 rounded-lg text-sm font-medium text-pb-text-secondary" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
                    Practice Again
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input area */}
          {!sessionComplete && (
            <div className="p-4 sm:p-6" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs text-pb-text-muted mb-2">{roundHints[round - 1] || ""}</p>
              <div className="flex items-end gap-3">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend(); }}
                  placeholder="Type your response..."
                  rows={2}
                  className="flex-1 resize-none rounded-xl p-3.5 text-sm text-foreground placeholder:text-pb-text-muted outline-none transition-all"
                  style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#6C63F6"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                />
                <button onClick={handleSend} disabled={!input.trim() || isTyping} className="px-5 py-3 rounded-xl text-sm font-semibold text-primary-foreground bg-gradient-primary hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2">
                  Send <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-pb-text-muted mt-1.5">Ctrl+Enter to send</p>
            </div>
          )}
        </div>

        {/* Score Panel */}
        <div className="w-full lg:w-[240px] p-4 sm:p-6 lg:border-l flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-wider text-pb-text-muted mb-2">Live Score</p>
            <div className="text-4xl font-bold tabular-nums mb-4" style={{ color: scoreColor }}>{score}<span className="text-lg text-pb-text-muted">/100</span></div>

            <div className="space-y-3">
              {(scenario.criteria || []).map((c, i) => (
                <div key={c}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-pb-text-secondary">{c}</span>
                    <span className="text-xs tabular-nums" style={{ color: criteriaScores[i] > 60 ? "#3DD68C" : criteriaScores[i] > 30 ? "#F5A623" : "#8891B4" }}>
                      {criteriaScores[i]}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div className="h-full rounded-full" animate={{ width: `${criteriaScores[i]}%` }} transition={{ duration: 0.5 }} style={{ background: criteriaScores[i] > 60 ? "#3DD68C" : criteriaScores[i] > 30 ? "#F5A623" : "#444C6E" }} />
                  </div>
                </div>
              ))}
            </div>

            {currentFeedback && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-3 rounded-xl text-xs text-pb-text-secondary leading-relaxed" style={{ background: "rgba(108,99,246,0.06)", border: "1px solid rgba(108,99,246,0.1)" }}>
                💡 {currentFeedback.coachHint}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
