import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { config } from "@/lib/config";
import { Shield, Lock, Globe, Eye } from "lucide-react";

export const metadata = {
  title: `Privacy Policy — ${config.app.name}`,
  description: `Privacy Policy and data processing terms for ${config.app.name}.`,
};

export default function PrivacyPage() {
  const supportEmail = config.app.supportEmail || "support@pitchgenius.com";
  const appName = config.app.name || "PitchGenius";

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans">
      <Navbar />

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="orb orb-cyan w-[500px] h-[500px] -top-40 -left-40 opacity-20" />
        <div className="orb orb-purple w-[500px] h-[500px] -bottom-40 -right-40 opacity-20" />
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 pt-32 pb-24">
        {/* Header */}
        <div className="mb-12">
          <div className="pill-badge mb-6">
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy</span>
          </div>
          <h1 className="hero-heading text-5xl md:text-6xl text-slate-900 dark:text-white mb-4">
            Privacy <span className="gradient-text">Policy</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Effective as of April 10, 2025
          </p>
        </div>

        {/* Intro feature cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Lock, title: "Encrypted", desc: "TLS in transit, AES-256 at rest", color: "from-cyan-500 to-blue-600" },
            { icon: Eye, title: "Transparent", desc: "Clear data usage principles", color: "from-purple-500 to-pink-500" },
            { icon: Globe, title: "GDPR Compliant", desc: "Full EU data rights supported", color: "from-emerald-500 to-teal-600" },
          ].map((item) => (
            <div key={item.title} className="apple-card p-5 border border-slate-200/60 dark:border-slate-800">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-3 shadow-sm`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="font-semibold text-sm text-slate-900 dark:text-white mb-1">{item.title}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="space-y-10 text-slate-600 dark:text-slate-300 text-[15px] leading-relaxed font-light">
          <p>
            This Privacy Policy describes how {appName} Tech, Inc. (&quot;{appName}&quot;, &quot;we&quot;, &quot;us&quot; or &quot;our&quot;) processes personal information that we collect through our digital properties, website, platform, and online services (the &quot;Service&quot;).
          </p>
          <p>
            {appName} provides an AI-based platform that generates and optimizes presentations, documents, and visual materials. This Privacy Policy does not apply to information that we process on behalf of enterprise business customers under dedicated data processing agreements.
          </p>

          {/* Quick Index */}
          <div className="apple-card p-6 bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-3">Quick Index</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-cyan-500" /> Personal information we collect</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-cyan-500" /> How we use your data</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-cyan-500" /> How we share your data</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-cyan-500" /> Your choices &amp; opt-outs</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-cyan-500" /> Security &amp; retention</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-cyan-500" /> Notice for European users</li>
            </ul>
          </div>

          <section className="space-y-4">
            <h2 className="hero-heading text-2xl text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
              Personal Information We Collect
            </h2>
            <p><strong className="text-slate-900 dark:text-white">Information you provide directly:</strong></p>
            <ul className="list-disc list-outside space-y-2 pl-5">
              <li><strong>Contact data:</strong> Name, email, mailing address, company, phone.</li>
              <li><strong>Profile data:</strong> Username, password, avatar, preferences.</li>
              <li><strong>Transactional data:</strong> Payment details processed via Stripe.</li>
              <li><strong>User content:</strong> Prompts, notes, PDFs, images, presentations you create.</li>
              <li><strong>Communications:</strong> Messages, feedback, support inquiries, survey responses.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="hero-heading text-2xl text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
              How We Use Your Information
            </h2>
            <ul className="list-disc list-outside space-y-2 pl-5">
              <li><strong>Service delivery:</strong> Operating and personalizing our platform.</li>
              <li><strong>R&amp;D:</strong> Analyzing usage to improve AI generation and features.</li>
              <li><strong>AI Model Optimization:</strong> We do NOT train public AI models on private team content.</li>
              <li><strong>Marketing:</strong> Service updates and newsletters (opt-out anytime).</li>
              <li><strong>Security:</strong> Fraud prevention and legal compliance.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="hero-heading text-2xl text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
              Security &amp; Data Retention
            </h2>
            <p>
              We implement industry-standard physical, technical, and organizational safeguards including TLS encryption in transit and AES-256 encryption at rest. Data is retained only as long as necessary and securely deleted or anonymized when no longer needed.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="hero-heading text-2xl text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
              Notice to European Users (GDPR)
            </h2>
            <p>
              If you are in the EEA or UK, you have rights under GDPR including access, rectification, erasure, restriction, and objection to processing.
            </p>

            <div className="apple-card overflow-hidden mt-4 border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-4 font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Purpose</th>
                    <th className="p-4 font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Data</th>
                    <th className="p-4 font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Legal Basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-4 font-medium text-slate-900 dark:text-white">Service Ops</td>
                    <td className="p-4 text-xs">Contact, Profile, Content</td>
                    <td className="p-4 text-xs text-cyan-600 dark:text-cyan-400">Contract</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-900 dark:text-white">AI &amp; Analytics</td>
                    <td className="p-4 text-xs">Device, Activity, Content</td>
                    <td className="p-4 text-xs text-purple-600 dark:text-purple-400">Legitimate Interests</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-900 dark:text-white">Marketing</td>
                    <td className="p-4 text-xs">Contact, Preferences</td>
                    <td className="p-4 text-xs text-emerald-600 dark:text-emerald-400">Consent</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-900 dark:text-white">Compliance</td>
                    <td className="p-4 text-xs">All Categories</td>
                    <td className="p-4 text-xs text-orange-600 dark:text-orange-400">Legal Obligation</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="hero-heading text-2xl text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
              Contact Us
            </h2>
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