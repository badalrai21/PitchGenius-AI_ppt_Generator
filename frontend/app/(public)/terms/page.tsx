import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { config } from "@/lib/config";
import { Shield, Scale, AlertCircle, Info } from "lucide-react";

export const metadata = {
  title: `Terms of Service — ${config.app.name}`,
  description: `Terms of Use Agreement for ${config.app.name}.`,
};

export default function TermsPage() {
  const supportEmail = config.app.supportEmail || "support@pitchgenius.com";
  const appName = config.app.name || "PitchGenius";
  const appUrl = config.app.url || "https://pitchgenius.com";

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans">
      <Navbar />

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="orb orb-blue w-[500px] h-[500px] -top-40 -right-40 opacity-20" />
        <div className="orb orb-purple w-[500px] h-[500px] -bottom-40 -left-40 opacity-20" />
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 pt-32 pb-24">
        {/* Header */}
        <div className="mb-12">
          <div className="pill-badge mb-6">
            <Scale className="w-3.5 h-3.5" />
            <span>Legal</span>
          </div>
          <h1 className="hero-heading text-5xl md:text-6xl text-slate-900 dark:text-white mb-4">
            Terms of <span className="gradient-text">Service</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span>Effective September 9, 2025</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{appName} Tech, Inc.</span>
          </div>
        </div>

        {/* Warning info banners */}
        <div className="space-y-4 mb-12">
          <div className="apple-card p-6 border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-sm text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-2">
                  Please read carefully
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  These Terms of Use (&quot;Terms&quot;) govern your use of the {appName} Tech, Inc. (&quot;{appName}&quot;, &quot;our&quot;, &quot;us&quot; and &quot;we&quot;) Site located at {appUrl} and online services available via the platform.
                </p>
              </div>
            </div>
          </div>

          <div className="apple-card p-6 border-l-4 border-l-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 text-cyan-600">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-sm text-cyan-900 dark:text-cyan-200 uppercase tracking-wider mb-2">
                  Automatic renewal notice
                </p>
                <p className="text-xs text-cyan-800 dark:text-cyan-300 leading-relaxed">
                  Subscriptions automatically renew for successive periods equal to your current billing term at the then-current subscription fee unless cancelled prior to renewal via your Account Settings.
                </p>
              </div>
            </div>
          </div>

          <div className="apple-card p-6 border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 text-purple-600">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-sm text-purple-900 dark:text-purple-200 uppercase tracking-wider mb-2">
                  Arbitration notice
                </p>
                <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed">
                  Section 16 requires that disputes be resolved by binding, individual arbitration administered by the American Arbitration Association (AAA), waiving right to class action participation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Body Sections */}
        <div className="space-y-10 text-slate-600 dark:text-slate-300 text-[15px] leading-relaxed font-light">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="hero-heading text-2xl text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
              1. Use of the Services
            </h2>
            <p>
              The Platform, the Site, the Services, and the content available on the Site are the sole property of {appName} and its licensors.
            </p>

            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white pt-2">1.1 License to the Services</h3>
            <p>
              Subject to your ongoing compliance with this Agreement, {appName} grants you a limited, non-exclusive, non-sublicensable and non-transferable license to access and use the Services for your personal or internal business purposes.
            </p>

            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white pt-2">1.4 Use of AI</h3>
            <p>
              Our Service utilizes third-party artificial intelligence models to generate presentation results, suggestions, and drafts based on user inputs. All AI results are provided &quot;as is&quot; and are intended as initial drafts rather than definitive finalized documentation.
            </p>

            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white pt-2">1.7 Certain Restrictions</h3>
            <p>
              You shall not: license, sell, or commercially exploit the Services; reverse engineer any part of the Services; use automated scrapers, spiders, or crawlers; or remove any proprietary markings.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="hero-heading text-2xl text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
              2. Registration and Accounts
            </h2>
            <p>
              To access certain features, you must become a Registered User by creating an Account. You may link through compatible Third-Party Accounts (Google or GitHub). You agree to provide true and accurate Registration Data and represent that you are at least sixteen (16) years old.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="hero-heading text-2xl text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
              3. Responsibility for Content
            </h2>
            <p>
              All Content is the sole responsibility of the party from whom such Content originated. You are entirely responsible for all Content that you upload, post, or transmit. {appName} reserves the right to remove any Content at its sole discretion.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="hero-heading text-2xl text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
              4. Ownership and Licenses
            </h2>
            <p>
              Except for Your Content, {appName} owns all rights, title, and interest in the Services. You grant {appName} a fully paid, royalty-free, worldwide license to use Your Content solely to operate, support, and improve the Services.
            </p>
            <div className="apple-card p-5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <p className="text-sm">
                <strong className="text-slate-900 dark:text-white">AI Model Training:</strong> If you are on a Team or Pro plan with privacy controls enabled, we <strong>do not</strong> train on Your Content.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="space-y-4">
            <h2 className="hero-heading text-2xl text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
              9. Fees and Purchase Terms
            </h2>
            <p>
              {appName} uses Stripe, Inc. as third-party payment service provider. All fees are payable in accordance with the billing terms in effect at the time due.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">Subscriptions &amp; Automatic Renewal:</strong> Subscriptions automatically renew for successive periods at the then-current subscription fee unless cancelled prior to renewal via Account Settings.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">No Refunds:</strong> All fees are non-refundable and there are no credits for partially used subscription periods.
            </p>
          </section>

          {/* Section 11 & 12 */}
          <section className="space-y-4">
            <h2 className="hero-heading text-2xl text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
              11 & 12. Disclaimers and Limitation of Liability
            </h2>
            <div className="apple-card p-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <p className="text-xs uppercase tracking-wider font-mono leading-relaxed">
                The Services are provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the maximum extent permitted by law, {appName.toUpperCase()} disclaims all warranties. In no event shall {appName.toUpperCase()} be liable for any indirect, incidental, or consequential damages, or for any amount exceeding the greater of $100 or the fees paid by you in the prior month.
              </p>
            </div>
          </section>

          {/* Section 16 */}
          <section className="space-y-4">
            <h2 className="hero-heading text-2xl text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
              16. Arbitration Agreement
            </h2>
            <p>
              Any dispute or claim relating to your use of the Services will be resolved by binding, individual arbitration through the American Arbitration Association (AAA). You and {appName} waive any right to a jury trial or to participate in a class action lawsuit.
            </p>
            <p>
              You have a 30-day right to opt out of arbitration by sending written notice to <a href={`mailto:${supportEmail}`} className="text-cyan-600 dark:text-cyan-400 hover:underline">{supportEmail}</a> within 30 days of first creating your account.
            </p>
          </section>

          {/* Section 17 */}
          <section className="space-y-4">
            <h2 className="hero-heading text-2xl text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
              17. Contact
            </h2>
            <p>
              These Terms are governed by the laws of the State of California. For any questions, claims, or notices:
            </p>
            <div className="apple-card p-6 bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/20 dark:to-blue-950/20 border border-slate-200/60 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-white mb-2">{appName} Tech, Inc.</p>
              <p className="text-sm">Email: <a href={`mailto:${supportEmail}`} className="text-cyan-600 dark:text-cyan-400 hover:underline">{supportEmail}</a></p>
              <p className="text-sm">Address: 2261 Market Street #4544, San Francisco, CA 94114</p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}