import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  MessageCircleQuestion, Mail, FileText, BookOpen,
  ExternalLink, ChevronRight, Sparkles, Zap,
  Shield, HelpCircle
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HelpPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch settings instantly
  const { data: settings } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["support_email", "app_name", "docs_url", "changelog_url"]);

  const settingsMap: Record<string, string> = {};
  if (settings) {
    settings.forEach((s) => { settingsMap[s.key] = s.value; });
  }

  const supportEmail = settingsMap.support_email || "support@pitchgenius.com";
  const docsUrl = settingsMap.docs_url || "#";
  const changelogUrl = settingsMap.changelog_url || "#";

  const helpCategories = [
    {
      title: "Getting Started",
      description: "New here? Learn the basics of creating AI-powered presentations.",
      icon: Sparkles,
      color: "from-cyan-50 to-blue-500/10",
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-600",
      items: [
        { label: "Create your first presentation", href: "/editor/new" },
        { label: "Browse template gallery", href: "/dashboard/templates" },
        { label: "Understanding AI generation", href: docsUrl },
      ],
    },
    {
      title: "Account & Billing",
      description: "Manage your subscription, payments, and account settings.",
      icon: Shield,
      color: "from-purple-50 to-indigo-500/10",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-600",
      items: [
        { label: "Change your plan", href: "/dashboard/upgrade" },
        { label: "Update account settings", href: "/dashboard/settings" },
        { label: "View billing history", href: "/dashboard/settings" },
      ],
    },
    {
      title: "Editor & Export",
      description: "Learn how to edit slides, add media, and export your work.",
      icon: FileText,
      color: "from-emerald-50 to-teal-500/10",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600",
      items: [
        { label: "Using the slide editor", href: docsUrl },
        { label: "Export to PPTX & PDF", href: docsUrl },
        { label: "AI image generation", href: docsUrl },
      ],
    },
    {
      title: "Advanced Features",
      description: "Explore analytics, sharing, live presenting, and more.",
      icon: Zap,
      color: "from-amber-50 to-orange-500/10",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-600",
      items: [
        { label: "Presentation analytics", href: "/dashboard/analytics" },
        { label: "Sharing & public links", href: docsUrl },
        { label: "Live presenter mode", href: docsUrl },
      ],
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 relative z-10">
      {/* Header */}
      <div className="mb-10">
        <div className="pill-badge mb-3">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-600" />
          <span>Help & Support</span>
        </div>
        <h1 className="hero-heading text-4xl md:text-5xl text-slate-900 dark:text-white mb-2">
          How can we <span className="gradient-text-vibrant">help you?</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-light max-w-2xl leading-relaxed">
          Find answers, learn new features, or reach out to our team directly. We&apos;re here to help you create amazing presentations.
        </p>
      </div>

      {/* Quick Contact Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <a
          href={`mailto:${supportEmail}`}
          className="group flex items-center gap-4 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all text-decoration-none"
        >
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Email Support</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{supportEmail}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>

        <a
          href={docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all text-decoration-none"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Documentation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Guides & tutorials</p>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>

        <a
          href={changelogUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all text-decoration-none"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">What&apos;s New</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Latest features & updates</p>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      </div>

      {/* Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {helpCategories.map((category, idx) => (
          <div
            key={idx}
            className="group rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-lg transition-all font-sans"
          >
            <div className="p-6 pb-4">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-11 h-11 rounded-xl ${category.iconBg} flex items-center justify-center ${category.iconColor} shrink-0`}>
                  <category.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">{category.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{category.description}</p>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800">
              {category.items.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group/item text-decoration-none"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-300 group-hover/item:text-cyan-600 dark:group-hover/item:text-cyan-400 transition-colors">
                    {item.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover/item:text-cyan-600 group-hover/item:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ CTA */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-br from-cyan-50/50 to-purple-50/50 dark:from-cyan-950/20 dark:to-purple-950/20 p-8 text-center">
        <MessageCircleQuestion className="w-10 h-10 text-cyan-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">
          Still have questions?
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
          Can&apos;t find what you&apos;re looking for? Our support team typically responds within a few hours.
        </p>
        <a
          href={`mailto:${supportEmail}`}
          className="btn-primary group inline-flex items-center gap-2 text-decoration-none"
        >
          <Mail className="w-4 h-4" />
          Contact Support
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
}