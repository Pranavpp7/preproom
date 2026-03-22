import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, Star, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import Footer from "@/components/Footer";

const faqs = [
  { q: "Is the AI realistic?", a: "Powered by Llama 3.3 70B on Groq. It responds the way real managers and interviewers do — with real constraints, real pushback, and real emotions." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel with one click from your dashboard. No questions asked." },
  { q: "What are the 5 free scenarios?", a: "Salary negotiation, ask for a promotion, disagree with your manager, handle a bad performance review, and nail the job interview." },
  { q: "Is my session data private?", a: "Yes. Your sessions are stored securely and never used to train AI models." },
  { q: "Do you offer team plans?", a: "Email us at teams@preproom.app for team pricing." },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { user } = useAuth();

  const handleProClick = (e: React.MouseEvent) => {
    if (user) {
      e.preventDefault();
      toast.success(`Pro coming soon — we'll notify you at ${user.email} when it's available.`);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">Simple pricing. Real results.</h1>
          <p className="text-base text-muted-foreground">Start free. Upgrade when you're ready.</p>

          <div className="inline-flex items-center gap-3 mt-6">
            <span className={`text-sm ${!annual ? "text-foreground font-medium" : "text-muted-foreground"}`}>Monthly</span>
            <button onClick={() => setAnnual(!annual)} className="relative w-12 h-6 rounded-full transition-colors bg-input" style={annual ? { background: "hsl(var(--primary))" } : {}}>
              <div className="absolute top-1 w-4 h-4 rounded-full bg-foreground transition-all" style={{ left: annual ? "28px" : "4px" }} />
            </button>
            <span className={`text-sm ${annual ? "text-foreground font-medium" : "text-muted-foreground"}`}>Annual</span>
            {annual && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Save 20%</span>}
          </div>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-pb p-6 flex flex-col">
            <h3 className="text-xl font-bold text-foreground mb-1">Free</h3>
            <div className="text-3xl font-bold text-foreground mb-1">$0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
            <p className="text-sm text-muted-foreground mb-6">Get started for free</p>
            <Link to="/signup" className="block text-center px-6 py-2.5 rounded-lg text-sm font-medium text-muted-foreground border border-border mb-6 transition-colors hover:text-foreground hover:border-foreground/20">
              Get started free →
            </Link>
            <ul className="space-y-3">
              {["5 scenarios", "Live session + score", "Session summary", "Full AI debrief", "Progress tracking", "Session history (last 3)"].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" /> {f}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-pb p-6 relative overflow-hidden flex flex-col" style={{ borderColor: "hsl(var(--primary) / 0.35)" }}>
            <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              <Star className="w-3 h-3" /> Most Popular
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1">Pro</h3>
            <div className="text-3xl font-bold text-foreground mb-1">
              ${annual ? "7.99" : "9.99"}<span className="text-sm font-normal text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{annual ? "Billed annually" : "Billed monthly"}</p>
            <Link
              to={user ? "#" : "/signup"}
              onClick={handleProClick}
              className="block text-center px-6 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground bg-gradient-primary mb-6"
            >
              Upgrade to Pro →
            </Link>
            <p className="text-xs text-muted-foreground mb-4">Everything in Free, plus:</p>
            <ul className="space-y-3">
              {["Unlimited scenarios", "AI Coach Mode", "Voice input", "Unlimited session history"].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 flex-shrink-0 text-primary" /> {f}
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
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === i ? "auto" : 0, opacity: openFaq === i ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="card-pb p-8 text-center">
            <h3 className="text-lg font-bold text-foreground mb-6">Have questions?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {[
                { label: "General", email: "hello@preproom.app" },
                { label: "Support", email: "support@preproom.app" },
                { label: "Teams & Enterprise", email: "teams@preproom.app" },
              ].map(c => (
                <div key={c.label} className="flex flex-col items-center gap-1.5">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">{c.label}</span>
                  <a href={`mailto:${c.email}`} className="text-sm text-foreground hover:text-primary transition-colors">{c.email}</a>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">We typically respond within 24 hours.</p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-muted-foreground mb-8">Preproom is a practice and training tool. It does not constitute professional career coaching or employment advice.</p>
      </div>
      <Footer />
    </div>
  );
}
