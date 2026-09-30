import Footer from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-pb-text-muted mb-8">Last Updated: September 2026</p>

        <div className="prose prose-sm prose-invert max-w-none space-y-6 text-pb-text-secondary leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">What We Collect</h2>
            <p>Preproom is a browser-based demo. Account details and session history (scores, scenario IDs, completion timestamps) stay in your browser via local storage. We do not run a server-side database that permanently stores your practice transcripts.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">AI Processing</h2>
            <p>To generate replies and coaching feedback, conversation text — and, in interview mode, uploaded CV text and any job description you provide — is sent to the Groq API through our serverless proxy. That content is used to generate responses and is not stored on our servers. Groq processes requests in real time; see Groq&apos;s own policies for provider-side retention. Session history that you see in the app remains in your browser.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Authentication & Storage</h2>
            <p>Sign-in for this demo is local to your browser. Clearing site data removes your local account record and practice history from that device.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Your Rights</h2>
            <p>Under GDPR and CCPA, you have the right to access, correct, or delete your personal data. Contact us at privacy@preproom.app to exercise these rights. You can also clear local data from your browser at any time.</p>
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
