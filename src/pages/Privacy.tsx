import Footer from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-pb-text-muted mb-8">Last Updated: March 2026</p>

        <div className="prose prose-sm prose-invert max-w-none space-y-6 text-pb-text-secondary leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">What We Collect</h2>
            <p>We store session metadata including scores, scenario IDs, and completion timestamps. We do not permanently store full conversation transcripts from your practice sessions.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">AI Processing</h2>
            <p>Preproom uses the Groq API (Llama 3.3 70B model) for AI-powered conversations. Groq does not train on API data. Your conversations are processed in real-time and not retained by the AI provider.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Authentication & Storage</h2>
            <p>We use Supabase for authentication and data storage. Your account data (email, name) is stored securely with industry-standard encryption.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Your Rights</h2>
            <p>Under GDPR and CCPA, you have the right to access, correct, or delete your personal data. Contact us at privacy@preproom.app to exercise these rights.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Contact</h2>
            <p>For privacy-related inquiries: privacy@preproom.app</p>
          </section>
        </div>
      </div>
      <div className="mt-20"><Footer /></div>
    </div>
  );
}
