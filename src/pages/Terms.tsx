import Footer from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-pb-text-muted mb-8">Last Updated: March 2026</p>

        <div className="prose prose-sm prose-invert max-w-none space-y-6 text-pb-text-secondary leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Service Description</h2>
            <p>Preproom is an AI-powered professional skills training platform that simulates workplace conversations for practice purposes.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Important Disclaimer</h2>
            <p className="font-medium text-foreground">PressureBox is a practice and training tool. It does not constitute professional career coaching, legal advice, or employment guidance. Results in real conversations may vary.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Account Terms</h2>
            <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Free & Pro Plans</h2>
            <p>Free accounts include 5 scenarios. Pro subscriptions can be cancelled at any time. Refunds are not provided for partial billing periods.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Contact</h2>
            <p>For legal inquiries: legal@pressurebox.app</p>
          </section>
        </div>
      </div>
      <div className="mt-20"><Footer /></div>
    </div>
  );
}
