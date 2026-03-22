import { Link } from "react-router-dom";
import PreproomLogo from "@/components/PreproomLogo";

export default function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <PreproomLogo size={24} />
            </div>
            <p className="text-sm text-pb-text-secondary leading-relaxed">Practice the conversation you've been dreading.</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-pb-text-muted mb-4">Product</h4>
            <div className="flex flex-col gap-2.5">
              <Link to="/scenarios" className="text-sm text-pb-text-secondary hover:text-foreground transition-colors">Scenarios</Link>
              <Link to="/pricing" className="text-sm text-pb-text-secondary hover:text-foreground transition-colors">Pricing</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-pb-text-muted mb-4">Account</h4>
            <div className="flex flex-col gap-2.5">
              <Link to="/signup" className="text-sm text-pb-text-secondary hover:text-foreground transition-colors">Sign Up</Link>
              <Link to="/signin" className="text-sm text-pb-text-secondary hover:text-foreground transition-colors">Sign In</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-pb-text-muted mb-4">Legal</h4>
            <div className="flex flex-col gap-2.5">
              <Link to="/privacy" className="text-sm text-pb-text-secondary hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-sm text-pb-text-secondary hover:text-foreground transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t text-center" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <p className="text-xs text-pb-text-muted">© 2026 PressureBox. A practice tool, not professional career advice.</p>
        </div>
      </div>
    </footer>
  );
}
