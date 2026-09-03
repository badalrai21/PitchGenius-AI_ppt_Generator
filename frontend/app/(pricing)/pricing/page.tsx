"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight, Zap, Star, Shield, Users, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { BrandLoader, BrandSpinner } from "@/components/ui/BrandLoader";
import { loadPlanLimitsFromDB } from "@/lib/quota";
import { config } from "@/lib/config";
import { toast } from "sonner";

interface DBPlan {
  id?: string;
  plan_name: string;
  stripe_price_id?: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits?: any;
  is_active?: boolean;
}

const FALLBACK_PLANS: DBPlan[] = [
  {
    plan_name: "free",
    price_monthly: 0,
    price_yearly: 0,
    features: [
      "5 presentations per month",
      "Up to 10 slides per deck",
      "Standard AI generation speeds",
      "Access to basic layout structures",
      "Standard PDF & PPTX file exports",
    ],
  },
  {
    plan_name: "pro",
    price_monthly: 9,
    price_yearly: 84,
    features: [
      "Unlimited presentation generations",
      "Up to 30 slides per presentation",
      "High-Resolution AI image integrations",
      "Full premium theme packages (20+ themes)",
      "Zero PitchGenius brand watermarks",
      "Advanced customized colors & fonts",
      "Dynamic model discovery acceleration",
    ],
  },
  {
    plan_name: "team",
    price_monthly: 19,
    price_yearly: 180,
    features: [
      "Everything included in Pro",
      "Up to 50 slides per generated deck",
      "10 included organization user seats",
      "Shared team workspace template sets",
      "Real-time simultaneous slide changes",
      "Enterprise security protocol priority",
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // ★ Database-driven plans state
  const [dbPlans, setDbPlans] = useState<DBPlan[]>(FALLBACK_PLANS);

  useEffect(() => {
    setMounted(true);

    async function fetchPricingData() {
      try {
        // Pre-hydrate quota memory cache
        await loadPlanLimitsFromDB();

        // ★ DYNAMIC PRICING QUERY: Fetch active tiers from Supabase pricing table
        const { data: pricingPlans, error } = await supabase
          .from("pricing")
          .select("*")
          .eq("is_active", true);

        if (!error && pricingPlans && pricingPlans.length > 0) {
          const sorted = [...pricingPlans].sort(
            (a, b) => (a.price_monthly || 0) - (b.price_monthly || 0)
          );
          setDbPlans(sorted);
        } else {
          setDbPlans(FALLBACK_PLANS);
        }
      } catch (err) {
        console.warn("[Pricing] Using fallback pricing tiers:", err);
        setDbPlans(FALLBACK_PLANS);
      } finally {
        setLoading(false);
      }
    }

    fetchPricingData();
  }, [supabase]);

  const handleSubscribe = async (planKey: string) => {
    if (planKey === "free") {
      router.push("/dashboard");
      return;
    }

    setLoadingPlan(planKey);
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      router.push(`/login?redirect=/pricing`);
      return;
    }

    try {
      const backendUrl = config.app.backendUrl || "http://localhost:8000";
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${backendUrl}/api/v1/payments/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          user_id: userData.user.id,
          email: userData.user.email,
          plan: planKey,
          billing_interval: isYearly ? "yearly" : "monthly",
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Payment server returned an invalid response.");
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Could not initialize checkout.");
      }

      const checkoutUrl = data.url || data.checkout_url || data.session_url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("No checkout URL returned from payment server.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout session.");
      setLoadingPlan(null);
    }
  };

  const formattedPlans = useMemo(() => {
    return dbPlans.map((plan) => {
      const key = plan.plan_name.toLowerCase();
      const isPro = key === "pro";
      const isTeam = key === "team";
      const isFree = key === "free";

      const monthly = plan.price_monthly || 0;
      const yearlyMonthlyEquivalent = plan.price_yearly && plan.price_yearly > 0
        ? Math.round(plan.price_yearly / 12)
        : monthly;

      const displayPrice = isYearly && !isFree ? yearlyMonthlyEquivalent : monthly;

      return {
        key,
        name: plan.plan_name.charAt(0).toUpperCase() + plan.plan_name.slice(1),
        price: displayPrice,
        period: isFree ? "forever" : "month",
        yearlyTotal: plan.price_yearly,
        yearlySavings: (!isFree && plan.price_yearly > 0)
          ? (monthly * 12) - plan.price_yearly
          : 0,
        description: isFree
          ? "For testing the waters"
          : isPro
            ? "For professional deck creators"
            : "For collaborative corporate workspaces",
        features: Array.isArray(plan.features) ? plan.features : [],
        popular: isPro,
        cta: isFree ? "Start Free" : `Upgrade to ${plan.plan_name.toUpperCase()}`,
        accentColor: isPro ? "#0077B6" : isTeam ? "#8b5cf6" : "#475569",
        gradient: isPro
          ? "from-cyan-500 via-blue-600 to-purple-600"
          : isTeam
            ? "from-purple-500 via-pink-500 to-orange-500"
            : "from-slate-400 to-slate-600",
      };
    });
  }, [dbPlans, isYearly]);

  if (!mounted || loading) {
    return <BrandLoader fullscreen size="lg" label="Loading pricing tiers..." />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 px-6 max-w-7xl mx-auto w-full relative">
        {/* Ambient background orbs */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[150px]" />
          <div className="absolute bottom-0 -right-40 h-[600px] w-[600px] rounded-full bg-pink-500/5 blur-[150px]" />
        </div>

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3.5 py-1 mb-6">
            <Zap className="h-3.5 w-3.5 text-cyan-600" />
            <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
              Transparent Pricing
            </span>
          </div>

          <h1 className="hero-heading text-4xl sm:text-5xl lg:text-6xl text-slate-900 dark:text-white mb-6">
            Invest in decks that
            <br />
            <span className="gradient-text-vibrant">close deals.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-light mb-10">
            Create high-converting presentations 10x faster. Adjust or cancel your choices at any point.
          </p>

          {/* Toggle Button */}
          <div className="inline-flex items-center relative rounded-full bg-slate-100 dark:bg-slate-800 p-1.5 shadow-sm border border-slate-200/60 dark:border-slate-700/50">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                !isYearly
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all relative ${
                isYearly
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Annual billing
              <span className="absolute -top-3.5 -right-3.5 text-[9px] font-extrabold bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 py-0.5 rounded-full shadow-md">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          {formattedPlans.map((plan) => (
            <div
              key={plan.key}
              className={`relative ${plan.popular ? "md:-mt-4" : ""}`}
            >
              {plan.popular && (
                <>
                  <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-3xl blur-md opacity-30" />
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                      <Sparkles className="h-3 w-3" /> Popular Choice
                    </span>
                  </div>
                </>
              )}

              <div
                className={`relative apple-card p-8 h-full flex flex-col justify-between ${
                  plan.popular ? "border-2 border-cyan-500/80 bg-white dark:bg-slate-900 shadow-xl" : "border border-slate-200 dark:border-slate-800"
                }`}
              >
                <div>
                  <h3 className="font-display text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{plan.description}</p>

                  <div className="flex items-baseline gap-1 mb-2">
                    <span
                      className="text-5xl font-display font-bold"
                      style={{ color: plan.accentColor }}
                    >
                      ${plan.price}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      /{plan.period}
                    </span>
                  </div>

                  {isYearly && plan.yearlySavings > 0 && (
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-6">
                      💰 Save ${plan.yearlySavings}/yr with annual billing
                    </p>
                  )}
                  {(!isYearly || plan.yearlySavings === 0) && (
                    <div className="h-4 mb-4" />
                  )}

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feat: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{
                            background: plan.popular
                              ? "linear-gradient(135deg, #06b6d4, #3b82f6)"
                              : plan.key === "team"
                                ? "linear-gradient(135deg, #8b5cf6, #ec4899)"
                                : "#e2e8f0",
                          }}
                        >
                          <Check
                            className="h-3 w-3"
                            strokeWidth={3}
                            style={{ color: plan.key === "free" ? "#64748b" : "#ffffff" }}
                          />
                        </div>
                        <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-snug">
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={loadingPlan === plan.key}
                  className={`w-full py-3.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    plan.popular
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 hover:scale-[1.02] active:scale-95"
                      : "border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {loadingPlan === plan.key ? (
                    <>
                      <BrandSpinner className="h-4 w-4" />
                      <span>Redirecting...</span>
                    </>
                  ) : (
                    <>
                      <span>{plan.cta}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Trust Matrix */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-12 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 font-display">
                Instant Plan Activation
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-light">
                Upgraded limits apply automatically upon checkout confirmation via Stripe webhook.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 font-display">
                Zero Long-Term Lock-in
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-light">
                Cancel or modify your subscriptions anytime directly from your dashboard billing panel.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 font-display">
                Priority Model Inference
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-light">
                Pro and Team accounts receive dedicated compute routes with lowest latency allocations.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}