"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Crown, Sparkles, Zap, Users, Star, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loadPlanLimitsFromDB } from "@/lib/quota";
import { UpgradeButton } from "@/components/dashboard/UpgradeButton";
import { ManageBillingButton } from "@/components/dashboard/ManageBillingButton";

const SkeletonBox = ({ className = "" }: { className?: string }) => (
  <div className={`bg-slate-200/70 dark:bg-slate-800/70 rounded-lg animate-pulse ${className}`} />
);

export default function UpgradePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dbPlans, setDbPlans] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (prof) setProfile(prof);

      // Warm up plan limits cache
      await loadPlanLimitsFromDB();

      // Dynamic Pricing retrieval from DB pricing table
      const { data: pricingPlans, error: pricingError } = await supabase
        .from("pricing")
        .select("*")
        .eq("is_active", true);

      if (!pricingError && pricingPlans && pricingPlans.length > 0) {
        const sorted = [...pricingPlans].sort((a, b) => (a.price_monthly || 0) - (b.price_monthly || 0));
        setDbPlans(sorted);
      } else {
        setDbPlans([
          { plan_name: "free", price_monthly: 0, price_yearly: 0, features: ["5 presentations/month", "Up to 10 slides/deck", "Standard AI support"] },
          { plan_name: "pro", price_monthly: 9, price_yearly: 84, features: ["Unlimited presentations", "Up to 30 slides/deck", "Priority AI response", "All designer themes"] },
          { plan_name: "team", price_monthly: 19, price_yearly: 180, features: ["Everything in Pro", "Up to 50 slides/deck", "10 team member seats", "Real-time collaboration"] }
        ]);
      }

      setLoading(false);
    })();
  }, [supabase, router]);

  const currentPlan = profile?.plan || "free";

  const mappedPlans = dbPlans.map((plan) => {
    const name = plan.plan_name.toLowerCase();
    const isPro = name === "pro";
    const isTeam = name === "team";

    return {
      key: name,
      name: plan.plan_name.charAt(0).toUpperCase() + plan.plan_name.slice(1),
      price: plan.price_monthly,
      yearlyPrice: plan.price_yearly,
      period: plan.price_monthly === 0 ? "forever" : "month",
      description: name === "free" ? "Perfect for trying out AI presentations" : name === "pro" ? "For professionals who present regularly" : "For teams that collaborate on decks",
      gradient: isPro ? "from-cyan-500 to-blue-600" : isTeam ? "from-purple-500 to-pink-600" : "from-slate-400 to-slate-600",
      accentColor: isPro ? "#0077B6" : isTeam ? "#8b5cf6" : "#334155",
      features: Array.isArray(plan.features) ? plan.features : [],
      highlighted: isPro,
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 font-sans relative z-10">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors text-decoration-none">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">Upgrade your plan</span>
        </div>
        <h1 className="hero-heading text-4xl md:text-5xl text-slate-900 dark:text-white mb-4">
          Choose the plan that <span className="gradient-text-vibrant">fits your workflow</span>
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
          Unlock unlimited AI presentations, premium themes, and priority support. Cancel anytime.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className={`relative rounded-3xl p-6 md:p-8 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 ${i === 2 ? "md:scale-[1.03]" : ""}`}
              style={{ minHeight: "540px" }}
            >
              <div className="space-y-4">
                <div className="space-y-2 mb-6">
                  <SkeletonBox className="h-6 w-24 rounded-lg" />
                  <SkeletonBox className="h-3 w-full rounded" />
                </div>
                <div className="flex items-baseline gap-2 mb-6">
                  <SkeletonBox className="h-14 w-24 rounded-xl" />
                  <SkeletonBox className="h-4 w-16 rounded" />
                </div>
                <div className="space-y-3 mb-8">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="flex items-center gap-2.5">
                      <SkeletonBox className="w-5 h-5 rounded-full" />
                      <SkeletonBox className="h-3 flex-1 rounded" />
                    </div>
                  ))}
                </div>
                <SkeletonBox className="h-12 w-full rounded-full" />
              </div>
            </div>
          ))
        ) : (
          mappedPlans.map((plan) => {
            const isCurrent = plan.key === currentPlan;

            return (
              <div
                key={plan.key}
                className={`relative rounded-3xl p-6 md:p-8 transition-all ${
                  plan.highlighted
                    ? "bg-white dark:bg-slate-900 border-2 border-cyan-500 shadow-2xl shadow-cyan-500/10 md:scale-[1.03]"
                    : "bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider shadow-lg" style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
                      <Star className="w-2.5 h-2.5" fill="currentColor" /> Most Popular
                    </div>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} /> Active
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold font-display" style={{ color: plan.accentColor }}>
                      ${plan.price}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">/{plan.period}</span>
                  </div>
                  {plan.price > 0 && plan.yearlyPrice > 0 && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                      💰 Save ${((plan.price * 12) - plan.yearlyPrice)}/yr with annual billing
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          background: plan.highlighted
                            ? "linear-gradient(135deg, #06b6d4, #3b82f6)"
                            : plan.key === "team"
                              ? "linear-gradient(135deg, #8b5cf6, #ec4899)"
                              : "#e2e8f0",
                        }}
                      >
                        <Check className="w-3 h-3" strokeWidth={3} style={{ color: plan.key === "free" ? "#64748b" : "#ffffff" }} />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  plan.key !== "free" ? (
                    <ManageBillingButton />
                  ) : (
                    <button disabled className="w-full py-3 rounded-full text-xs font-bold cursor-not-allowed" style={{ backgroundColor: "#f1f5f9", color: "#94a3b8" }}>
                      Current Plan
                    </button>
                  )
                ) : plan.key === "free" ? (
                  <Link href="/dashboard" className="w-full block text-center py-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors text-decoration-none">
                    Continue Free
                  </Link>
                ) : (
                  <UpgradeButton plan={plan.key} label={`Upgrade to ${plan.name} — $${plan.price}/mo`} interval="monthly" variant={plan.highlighted ? "gradient" : "outline"} />
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="p-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 mb-3"><Zap className="w-6 h-6" /></div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Instant Access</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Upgrade takes effect immediately.</p>
        </div>
        <div className="p-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 mb-3"><Users className="w-6 h-6" /></div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Cancel Anytime</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">No long-term contracts.</p>
        </div>
        <div className="p-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-3"><Star className="w-6 h-6" /></div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Loved by 10K+</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Rated 4.9/5 worldwide.</p>
        </div>
      </div>
    </div>
  );
}