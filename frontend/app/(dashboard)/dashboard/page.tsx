import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, Crown, ArrowRight, Sparkles, Compass, CheckCircle2, TrendingUp, Zap } from "lucide-react";
import { ManageBillingButton } from "@/components/dashboard/ManageBillingButton";
import { UpgradeButton } from "@/components/dashboard/UpgradeButton";
import { DashboardDeckPreview } from "@/components/dashboard/DashboardDeckPreview";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1. Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. Fetch user's presentations with slides_data + custom_theme for real previews
  const { data: presentations, error: presError } = await supabase
    .from("presentations")
    .select("id, title, slide_count, created_at, updated_at, status, slides_data, custom_theme, view_count")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (presError) console.error("Fetch presentations error:", presError);

  // 3. Dynamic pricing config
  const { data: pricingData } = await supabase
    .from("pricing")
    .select("*")
    .eq("is_active", true);

  const activePlans = pricingData || [];
  const currentPlan = (profile?.plan || "free").toLowerCase();
  
  const currentPlanRecord = activePlans.find(p => p.plan_name.toLowerCase() === currentPlan);
  const proPlanRecord = activePlans.find(p => p.plan_name.toLowerCase() === "pro");

  const planLimits = (currentPlanRecord?.limits as any) || {};
  const maxPresentations = typeof planLimits.presentations === "number" 
    ? planLimits.presentations 
    : (currentPlan === "free" ? 5 : -1);

  const limitDisplay = maxPresentations === -1 ? "∞" : maxPresentations;
  const pptsUsed = Math.max(profile?.ppt_count_month || 0, presentations?.length || 0);
  const usageProgress = maxPresentations === -1 ? null : Math.min(100, (pptsUsed / maxPresentations) * 100);
  const proPriceMonthly = proPlanRecord?.price_monthly ?? 9;
  const totalViews = presentations?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;

  const resolvedName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const firstName = resolvedName.split(" ")[0];
  const isPaidUser = currentPlan !== "free";

  return (
    <main className="max-w-[1600px] mx-auto px-6 pt-24 pb-16 font-sans">
      {/* ═══════════ WELCOME HERO ═══════════ */}
      <div className="relative mb-10 rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-br from-white via-cyan-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 p-8 md:p-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-gradient-to-br from-pink-500/8 to-orange-500/8 rounded-full blur-3xl translate-y-1/2" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/40 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>All systems operational</span>
            </div>
            <h1 className="hero-heading text-4xl md:text-5xl text-slate-900 dark:text-white mb-3">
              Good to see you, <span className="gradient-text-vibrant">{firstName}</span>
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400 font-light max-w-xl leading-relaxed">
              Ready to build something incredible? Turn your next big idea into a stunning presentation in under 30 seconds.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link href="/editor/new" className="group inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-decoration-none">
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>New Presentation</span>
            </Link>
            <Link href="/dashboard/templates" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm text-slate-900 dark:text-white text-sm font-semibold border border-slate-200/60 dark:border-slate-700/40 hover:bg-white dark:hover:bg-slate-800 transition-all text-decoration-none">
              <Compass className="w-4 h-4 text-cyan-600" />
              <span>Browse Templates</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════ STATS ROW ═══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { icon: FileText, label: "Total Decks", value: presentations?.length || 0, detail: "All-time created", color: "from-cyan-500 to-blue-600", iconBg: "bg-cyan-500/10", iconColor: "text-cyan-600" },
          { icon: Zap, label: "This Month", value: pptsUsed, detail: `of ${limitDisplay} available`, color: "from-purple-500 to-pink-600", iconBg: "bg-purple-500/10", iconColor: "text-purple-600", progress: usageProgress },
          { icon: TrendingUp, label: "Total Views", value: totalViews.toLocaleString(), detail: "Across shared links", color: "from-emerald-500 to-teal-600", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600" },
          { icon: Crown, label: "Plan", value: currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1), detail: currentPlan === "free" ? "Upgrade for more" : "Active subscription", color: "from-amber-500 to-orange-600", iconBg: "bg-amber-500/10", iconColor: "text-amber-600" },
        ].map((stat, i) => (
          <div key={i} className="group relative rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden">
            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} opacity-[0.08] blur-2xl group-hover:opacity-20 transition-opacity`} />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center ${stat.iconColor}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
              </div>
              <div className="text-3xl font-display font-bold text-slate-900 dark:text-white">{stat.value}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.detail}</p>
              {stat.progress !== null && stat.progress !== undefined && (
                <div className="mt-3 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${stat.color}`} style={{ width: `${Math.min(100, stat.progress)}%` }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════ BILLING BANNER ═══════════ */}
      {!isPaidUser && (
        <div className="mb-10 rounded-3xl overflow-hidden relative border border-purple-200/50 dark:border-purple-900/30">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
          <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
                <Crown className="w-7 h-7" fill="currentColor" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold font-display mb-1">Unlock PitchGenius Pro</h3>
                <p className="text-sm text-white/90 max-w-lg">
                  Unlimited decks · 30 slides per presentation · Premium themes · Priority AI · Remove watermark
                </p>
              </div>
            </div>
            <div className="w-full md:w-auto shrink-0">
              <UpgradeButton plan="pro" label={`Upgrade to Pro — $${proPriceMonthly}/mo`} interval="monthly" variant="primary" />
            </div>
          </div>
        </div>
      )}

      {isPaidUser && (
        <div className="mb-10 rounded-3xl overflow-hidden relative border border-emerald-200/50 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 p-8 md:p-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl md:text-2xl font-bold font-display text-slate-900 dark:text-white capitalize">
                    {currentPlan} Plan Active
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    <Crown className="w-2.5 h-2.5" />
                    Premium
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg">
                  Enjoying unlimited decks, priority AI generation, and premium themes. Manage your subscription anytime.
                </p>
              </div>
            </div>
            <div className="w-full md:w-auto shrink-0">
              <ManageBillingButton />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ PRESENTATIONS SECTION ═══════════ */}
      <div className="flex items-center justify-between mb-8 font-sans">
        <div>
          <h2 className="hero-heading text-2xl md:text-3xl text-slate-900 dark:text-white">Your Presentations</h2>
          <p className="text-sm text-slate-500 mt-1">
            {presentations?.length || 0} {presentations?.length === 1 ? "deck" : "decks"} in your library
          </p>
        </div>
        <Link href="/editor/new" className="btn-primary group !px-5 !py-2.5 text-sm text-decoration-none">
          <Plus className="h-4 w-4 mr-1.5" />
          New Presentation
        </Link>
      </div>

      {presentations && presentations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {presentations.map((deck) => (
            <DashboardDeckPreview key={deck.id} deck={deck} />
          ))}
        </div>
      ) : (
        <div className="apple-card p-16 text-center border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mx-auto mb-6">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="hero-heading text-2xl text-slate-900 dark:text-white mb-2">No presentations yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto font-light">Create your first AI-powered deck in under 30 seconds.</p>
          <Link href="/editor/new" className="btn-primary group text-decoration-none">
            <Plus className="h-4 w-4 mr-1.5" />
            Create First Presentation
          </Link>
        </div>
      )}
    </main>
  );
}