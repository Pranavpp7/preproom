import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, Star } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const faqs = [
  { q: "Is the AI realistic?", a: "Powered by Llama 3.3 70B. It's trained to respond the way real managers and interviewers do — with real constraints, real emotions, and real pushback." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel with one click from your dashboard. No questions asked." },
  { q: "What are the 5 free scenarios?", a: "Salary negotiation, ask for a promotion, disagree with your manager, handle a bad performance review, and job interview." },
  { q: "Is my session data private?", a: "Yes. Your sessions are stored securely and never used to train AI models." },
  { q: "Do companies use PressureBox for teams?", a: "Email us at teams@pressurebox.app for team plans." },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">Simple pricing. Real results.</h1>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 mt-4">
            <span className={`text-sm ${!annual ? "text-foreground" : "text-pb-text-muted"}`}>Monthly</span>
            <button onClick={() => setAnnual(!annual)} className="relative w-12 h-6 rounded-full transition-colors" style={{ background: annual ? "#6C63F6" : "rgba(255,255,255,0.15)" }}>
              <div className="absolute top-1 w-4 h-4 rounded-full bg-primary-foreground transition-all" style={{ left: annual ? "28px" : "4px" }} />
            </button>
            <span className={`text-sm ${annual ? "text-foreground" : "text-pb-text-muted"}`}>Annual</span>
            {annual && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(61,214,140,0.12)", color: "#3DD68C" }}>Save 20%</span>}
          </div>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          {/* Free */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-pb p-6">
            <h3 className="text-xl font-bold text-foreground mb-1">Free</h3>
            <div className="text-3xl font-bold text-foreground mb-1">$0<span className="text-sm font-normal text-pb-text-muted">/month</span></div>
            <p className="text-sm text-pb-text-secondary mb-6">Get started for free</p>
            <Link to="/signup" className="block text-center px-6 py-2.5 rounded-lg text-sm font-medium text-pb-text-secondary mb-6 transition-colors hover:text-foreground" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
              Get started free →
            </Link>
            <ul className="space-y-3">
              {["5 scenarios", "Live session + score", "Session summary", "Full AI debrief", "Progress tracking", "Session history (last 3)"].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-pb-text-secondary">
                  <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#3DD68C" }} /> {f}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Pro */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-pb p-6 relative overflow-hidden" style={{ border: "1px solid rgba(108,99,246,0.35)" }}>
            <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(108,99,246,0.12)", color: "#7C6FF7" }}>
              <Star className="w-3 h-3" /> Most Popular
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1">Pro</h3>
            <div className="text-3xl font-bold text-foreground mb-1">
              ${annual ? "7.99" : "9.99"}<span className="text-sm font-normal text-pb-text-muted">/month</span>
            </div>
            <p className="text-sm text-pb-text-secondary mb-6">{annual ? "Billed annually" : "Billed monthly"}</p>
            <Link to="/signup" className="block text-center px-6 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground bg-gradient-primary mb-6">
              Start 7-day free trial →
            </Link>
            <p className="text-xs text-pb-text-muted mb-4">Everything in Free, plus:</p>
            <ul className="space-y-3">
              {["Unlimited scenarios", "AI Coach Mode", "Certificates (LinkedIn)", "Voice input", "Unlimited session history"].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-pb-text-secondary">
                  <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#7C6FF7" }} /> {f}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="card-pb overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
                  <span className="text-sm font-medium text-foreground">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-pb-text-muted transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-pb-text-secondary leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
