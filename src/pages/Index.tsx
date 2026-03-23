import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import ScenarioCard from "@/components/ScenarioCard";
import ProductWalkthrough from "@/components/ProductWalkthrough";
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
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute inset-0 bg-dot-grid" />
        <div className="absolute top-[10%] left-[30%] w-[400px] h-[400px] rounded-full opacity-[0.08] animate-float-orb" style={{ background: "radial-gradient(circle, #6C63F6, transparent 70%)" }} />
        <div className="absolute top-[20%] right-[25%] w-[300px] h-[300px] rounded-full opacity-[0.06] animate-float-orb-delayed" style={{ background: "radial-gradient(circle, #5B8AF5, transparent 70%)" }} />

        <motion.div className="relative z-10 max-w-[740px] mx-auto px-4 text-center pt-24" variants={stagger} initial="initial" animate="animate">

          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-[62px] font-extrabold text-foreground leading-[1.1] tracking-[-1.5px] mb-6">
            Practice the conversation{" "}
            <span className="text-gradient-primary">you've been dreading.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-base sm:text-[17px] text-pb-text-secondary max-w-[500px] mx-auto leading-relaxed">
            The AI plays your manager, interviewer, or client and pushes back just like they would.
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="relative text-[20px] sm:text-[22px] font-semibold max-w-[500px] mx-auto mt-3 mb-8"
            style={{
              background: "linear-gradient(90deg, #7C6FF7, #38BDF8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            No judgment. No consequences. Just practice.
            <span
              className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 h-[2px] rounded-full"
              style={{
                width: "60%",
                background: "linear-gradient(90deg, rgba(124,111,247,0.5), rgba(56,189,248,0.5))",
                animation: "tagline-glow 3s ease-in-out infinite",
              }}
            />
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link to="/scenarios" className="px-7 py-3 rounded-lg font-semibold text-primary-foreground bg-gradient-primary hover:opacity-90 transition-opacity flex items-center gap-2">
              Start practicing free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#how-it-works" className="px-6 py-3 rounded-lg font-medium text-pb-text-secondary hover:text-foreground transition-colors" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
              See how it works
            </a>
          </motion.div>

          <motion.p variants={fadeUp} className="text-sm text-pb-text-muted">
            No credit card · 6 free scenarios · 5 minutes to start
          </motion.p>
        </motion.div>
      </section>

      {/* Auto-Playing Demo */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">Try it right now.</h2>
            <p className="text-sm text-pb-text-secondary">Salary negotiation · Meridian Analytics · Junior → Mid-level · $62k → $78k ask</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <AutoPlayDemo />
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
          <p className="text-pb-text-secondary text-center mb-12">6 free scenarios · Unlimited with Pro</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {freeScenarios.map(s => <ScenarioCard key={s.id} scenario={s} />)}
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
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight text-center mb-12">From people who prepared.</h2>
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
          <p className="text-pb-text-secondary mb-8">6 free scenarios. No credit card.</p>
          <Link to="/scenarios" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-primary-foreground bg-gradient-primary hover:opacity-90 transition-opacity text-lg">
            Start free <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
