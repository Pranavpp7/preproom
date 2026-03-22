import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Flame } from "lucide-react";

const mockUser = null; // Set to { name: "Alex", streak: 3 } to test logged-in state

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/scenarios", label: "Scenarios" },
    { to: "/pricing", label: "Pricing" },
    ...(mockUser ? [{ to: "/dashboard", label: "Dashboard" }] : []),
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: "rgba(7,8,15,0.88)", backdropFilter: "blur(14px)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center font-extrabold text-sm text-primary-foreground">
              P
            </div>
            <span className="font-extrabold text-lg tracking-tight text-foreground">PressureBox</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? "text-foreground bg-pb-surface2/50"
                    : "text-pb-text-secondary hover:text-foreground hover:bg-pb-surface2/30"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-3">
            {mockUser ? (
              <>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold" style={{ background: "rgba(245,166,35,0.12)", color: "#F5A623" }}>
                  <Flame className="w-3.5 h-3.5" />
                  {mockUser.streak}
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {mockUser.name[0]}
                </div>
              </>
            ) : (
              <>
                <Link to="/signin" className="px-4 py-2 rounded-lg text-sm font-medium text-pb-text-secondary hover:text-foreground transition-colors" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
                  Sign in
                </Link>
                <Link to="/signup" className="px-5 py-2 rounded-lg text-sm font-semibold text-primary-foreground bg-gradient-primary hover:opacity-90 transition-opacity">
                  Start free
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-pb-text-secondary hover:text-foreground">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        <div className="shimmer-line" />
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(7,8,15,0.95)", backdropFilter: "blur(20px)" }}
          >
            <div className="pt-24 px-6 flex flex-col gap-2">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-xl text-lg font-semibold text-foreground hover:bg-pb-surface2/30 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-6 flex flex-col gap-3">
                <Link to="/signin" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-xl text-center text-sm font-medium text-pb-text-secondary" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
                  Sign in
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-xl text-center text-sm font-semibold text-primary-foreground bg-gradient-primary">
                  Start free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
