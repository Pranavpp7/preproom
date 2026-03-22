import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import PreproomLogo from "@/components/PreproomLogo";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUp(name, email, password);
      navigate("/scenarios");
    } catch (err: any) {
      setError(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-12" style={{ background: "#07080F" }}>
        <div className="absolute inset-0 bg-hero-glow opacity-60" />
        <div className="relative z-10 max-w-md">
          <p className="text-2xl sm:text-3xl font-bold text-foreground leading-snug mb-8">"The most important conversations of your career deserve more than one attempt."</p>
          <div className="space-y-3 mb-10">
            {["5 free AI-powered scenarios", "Real-time scoring & feedback", "Full debrief with coaching", "Track your improvement over time"].map(f => (
              <div key={f} className="flex items-center gap-3">
                <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#3DD68C" }} />
                <span className="text-sm text-pb-text-secondary">{f}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {["#7C6FF7", "#5B8AF5", "#3DD68C", "#F5A623"].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-primary-foreground" style={{ background: c, borderColor: "#07080F" }}>
                  {["A", "M", "P", "D"][i]}
                </div>
              ))}
            </div>
            <span className="text-sm text-pb-text-muted">For anyone facing a conversation that matters</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12" style={{ background: "#0F1120" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-8">
            <PreproomLogo size={28} />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Create your account</h2>
          <p className="text-sm text-pb-text-secondary mb-8">Start practicing in under 5 minutes</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-xs font-medium" style={{ background: "rgba(245,101,101,0.08)", color: "#F56565", border: "1px solid rgba(245,101,101,0.15)" }}>
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-medium text-pb-text-secondary mb-1.5 block">Full name</label>
              <input type="text" placeholder="Alex Morgan" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3.5 py-2.5 rounded-xl text-sm text-foreground placeholder:text-pb-text-muted outline-none transition-all" style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
            <div>
              <label className="text-xs font-medium text-pb-text-secondary mb-1.5 block">Email</label>
              <input type="email" placeholder="alex@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3.5 py-2.5 rounded-xl text-sm text-foreground placeholder:text-pb-text-muted outline-none transition-all" style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
            <div>
              <label className="text-xs font-medium text-pb-text-secondary mb-1.5 block">Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full px-3.5 py-2.5 rounded-xl text-sm text-foreground placeholder:text-pb-text-muted outline-none transition-all" style={{ background: "#161829", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl text-sm font-semibold text-primary-foreground bg-gradient-primary hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-xs text-pb-text-muted text-center mt-6">
            Already have an account?{" "}
            <Link to="/signin" className="font-medium" style={{ color: "#7C6FF7" }}>Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
