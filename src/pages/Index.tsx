import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Star } from "lucide-react";
import Footer from "@/components/Footer";
import ScenarioCard from "@/components/ScenarioCard";
import InteractiveDemo from "@/components/InteractiveDemo";
import { freeScenarios, lockedScenarios } from "@/data/scenarios";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute inset-0 bg-dot-grid" />
        <div className="absolute top-[10%] left-[30%] w-[400px] h-[400px] rounded-full opacity-[0.08] animate-float-orb" style={{ background: "radial-gradient(circle, #6C63F6, transparent 70%)" }} />
        <div className="absolute top-[20%] right-[25%] w-[300px] h-[300px] rounded-full opacity-[0.06] animate-float-orb-delayed" style={{ background: "radial-gradient(circle, #5B8AF5, transparent 70%)" }} />

        <motion.div className="relative z-10 max-w-[740px] mx-auto px-4 text-center pt-24" variants={stagger} initial="initial" animate="animate">
          {/* Pill badge */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8" style={{ background: "rgba(108,99,246,0.12)", color: "#7C6FF7", border: "1px solid rgba(108,99,246,0.25)" }}>
            <Star className="w-3.5 h-3.5" />
            For early-career professionals
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-[62px] font-extrabold text-foreground leading-[1.1] tracking-[-1.5px] mb-6">
            Practice the conversation{" "}
            <span className="text-gradient-primary">you've been dreading.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p variants={fadeUp} className="text-base sm:text-[17px] text-pb-text-secondary max-w-[500px] mx-auto mb-8 leading-relaxed">
            The AI plays your manager, recruiter, or interviewer — and pushes back just like they would. Build the confidence to handle it before it counts.
          </motion.p>

          {/* Buttons */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link to="/scenarios" className="px-7 py-3 rounded-lg font-semibold text-primary-foreground bg-gradient-primary hover:opacity-90 transition-opacity flex items-center gap-2">
              Start practicing free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#how-it-works" className="px-6 py-3 rounded-lg font-medium text-pb-text-secondary hover:text-foreground transition-colors" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
              See how it works
            </a>
          </motion.div>

          <motion.p variants={fadeUp} className="text-sm text-pb-text-muted">
            No credit card · 5 free scenarios · 5 minutes to start
          </motion.p>
        </motion.div>
      </section>

      {/* Before/After Strip */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="card-pb p-6" style={{ borderLeft: "4px solid #F56565" }}>
            <span className="text-xs font-bold uppercase tracking-widest text-pb-red mb-3 block" style={{ color: "#F56565" }}>Before</span>
            <p className="text-foreground leading-relaxed italic mb-4">"I froze when my manager pushed back on my raise request. Said 'okay, that's fine' and left $8,000 on the table."</p>
            <p className="text-sm text-pb-text-muted">— Jamie L., 2 years at Deloitte</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="card-pb p-6" style={{ borderLeft: "4px solid #7C6FF7" }}>
            <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: "#7C6FF7" }}>After PressureBox</span>
            <p className="text-foreground leading-relaxed italic mb-4">"I practiced the exact pushback three times. When it happened for real, I held my ground and got the number I asked for."</p>
            <p className="text-sm text-pb-text-muted">— Jamie L., 3 months later</p>
          </motion.div>
        </div>
      </section>

      {/* Live Session Preview */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">This is what practice looks like.</h2>
            <p className="text-sm text-pb-text-secondary">Salary negotiation · Meridian Analytics · Junior → Mid-level · $62k → $78k ask</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card-pb overflow-hidden">
            <div className="p-6 space-y-4">
              {/* AI Message */}
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: "rgba(245,101,101,0.15)", color: "#F56565" }}>SC</div>
                <div>
                  <p className="text-xs text-pb-text-muted mb-1.5">Sarah Chen — Engineering Manager, Meridian Analytics</p>
                  <div className="rounded-xl p-4 text-sm text-foreground leading-relaxed" style={{ background: "rgba(245,101,101,0.06)", border: "1px solid rgba(245,101,101,0.12)" }}>
                    "Look, I want to be honest with you — I think you've had a strong year. But $78k is a significant jump from $62k. Our standard band for mid-level analysts tops out at $71k, and I've already gone to bat for you with HR. I'm not sure I can push further than that."
                  </div>
                </div>
              </div>

              {/* User Message */}
              <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
                <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: "rgba(108,99,246,0.15)", color: "#7C6FF7" }}>Y</div>
                <div>
                  <p className="text-xs text-pb-text-muted mb-1.5 text-right">You</p>
                  <div className="rounded-xl p-4 text-sm text-foreground leading-relaxed" style={{ background: "rgba(108,99,246,0.08)", border: "1px solid rgba(108,99,246,0.15)" }}>
                    "I appreciate you going to bat for me — genuinely. But I've looked at market data from Levels.fyi and Glassdoor, and mid-level data analysts in this city are ranging $74-82k. Given that I led the Q3 pipeline rebuild that cut reporting time by 40%, I think $78k is fair to both of us. Can we find a way to get there?"
                  </div>
                </div>
              </div>

              {/* Feedback strip */}
              <div className="flex items-center gap-3 flex-wrap px-2" style={{ borderTop: "1px solid rgba(61,214,140,0.12)", paddingTop: "12px" }}>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(61,214,140,0.1)", color: "#3DD68C" }}>✓ Used market data</span>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(61,214,140,0.1)", color: "#3DD68C" }}>✓ Cited specific impact</span>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(245,166,35,0.1)", color: "#F5A623" }}>⚠ Could hold the number firmer</span>
                <span className="text-xs font-bold ml-auto" style={{ color: "#3DD68C" }}>+16 pts</span>
              </div>
            </div>

            {/* Input bar preview */}
            <div className="px-6 pb-5">
              <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-sm text-pb-text-muted flex-1">Your response...</span>
                <button className="px-4 py-1.5 rounded-lg text-sm font-semibold text-primary-foreground bg-gradient-primary">Send →</button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Debrief Preview */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">What you get after every session.</h2>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card-pb p-6 space-y-5">
            {/* Score */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold tabular-nums" style={{ color: "#3DD68C" }}>72</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>

            {/* Top Strength */}
            <div className="rounded-xl p-4" style={{ background: "rgba(61,214,140,0.06)", border: "1px solid rgba(61,214,140,0.12)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#3DD68C" }}>Top Strength</p>
              <p className="text-sm text-foreground leading-relaxed italic">"You acknowledged the budget constraint before pushing back — that's exactly right."</p>
            </div>

            {/* Biggest Mistake */}
            <div className="rounded-xl p-4" style={{ background: "rgba(245,101,101,0.06)", border: "1px solid rgba(245,101,101,0.12)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#F56565" }}>Biggest Mistake</p>
              <p className="text-sm text-foreground leading-relaxed italic">"In round 2 you said 'I was kind of thinking maybe $75k' — the word <span className="font-semibold">maybe</span> gave away your anchor immediately."</p>
            </div>

            {/* Master Response */}
            <div className="rounded-xl p-4" style={{ borderLeft: "4px solid #7C6FF7", background: "rgba(108,99,246,0.06)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#7C6FF7" }}>How a strong negotiator would have said it</p>
              <p className="text-sm text-foreground leading-relaxed">"Based on market data for this role, $78k is the right number. I led the Q3 pipeline rebuild that saved 40% in reporting time — I'd like my comp to reflect that."</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight text-center mb-14">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Choose a scenario", desc: "Pick the high-stakes conversation coming up in your career." },
              { step: "02", title: "Respond under pressure", desc: "The AI plays the other person, pushes back, and escalates — just like real life." },
              { step: "03", title: "Get coached", desc: "Receive a full debrief: your score, what you did well, your biggest mistake, and a better version of your response." },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-primary mx-auto mb-4 flex items-center justify-center font-bold text-primary-foreground text-sm">{item.step}</div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-pb-text-secondary leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Scenarios Preview */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight text-center mb-4">Training scenarios</h2>
          <p className="text-pb-text-secondary text-center mb-12">5 free scenarios · Unlimited with Pro</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {freeScenarios.map(s => <ScenarioCard key={s.id} scenario={s} />)}
            {lockedScenarios.slice(0, 3).map(s => <ScenarioCard key={s.id} scenario={s} />)}
          </div>
          <div className="text-center mt-8">
            <Link to="/scenarios" className="text-sm font-medium hover:underline" style={{ color: "#7C6FF7" }}>
              View all scenarios →
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight text-center mb-12">What people are saying</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "Got $11k above my initial offer. The AI was harder than my actual recruiter.", name: "Aisha R.", role: "Junior Analyst at XYZ Consulting" },
              { quote: "The interview scenario asked questions my real panel never thought of. Walked in over-prepared. First senior role at 24.", name: "Tom B.", role: "Associate at ABC Partners" },
              { quote: "I'd been avoiding a difficult conversation with my manager for three months. Two sessions and I finally had it. Went better than I expected.", name: "Neha S.", role: "Coordinator at XYZ Group" },
            ].map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card-pb p-6">
                <p className="text-sm text-foreground leading-relaxed mb-4 italic">"{t.quote}"</p>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-pb-text-muted">{t.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">Stop dreading it. Start practicing.</h2>
          <p className="text-pb-text-secondary mb-8">5 free scenarios. No credit card.</p>
          <Link to="/scenarios" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-primary-foreground bg-gradient-primary hover:opacity-90 transition-opacity text-lg">
            Start free <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
