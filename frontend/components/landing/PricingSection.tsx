"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PlanItem {
  name: string;
  description: string;
  price: { monthly: number; yearly: number };
  features: string[];
  cta: string;
  href: string;
  highlighted: boolean;
  color: string;
}

const FALLBACK_PLANS: PlanItem[] = [
  {
    name: "Free",
    description: "Perfect for trying things out",
    price: { monthly: 0, yearly: 0 },
    features: [
      "5 presentations per month",
      "Up to 10 slides per deck",
      "PDF & PPTX export",
      "10 premium themes",
      "Basic AI generation",
    ],
    cta: "Start Free",
    href: "/signup",
    highlighted: false,
    color: "from-slate-500 to-slate-700",
  },
  {
    name: "Pro",
    description: "For professionals who create often",
    price: { monthly: 9, yearly: 7 },
    features: [
      "Unlimited presentations",
      "Up to 30 slides per deck",
      "AI image generation",
      "All premium themes",
      "Priority AI models",
      "Custom branding",
      "Remove watermark",
      "Priority support",
    ],
    cta: "Get Pro",
    href: "/signup?plan=pro",
    highlighted: true,
    color: "from-pink-500 via-purple-500 to-cyan-500",
  },
  {
    name: "Team",
    description: "For teams that build together",
    price: { monthly: 19, yearly: 15 },
    features: [
      "Everything in Pro",
      "Up to 50 slides per deck",
      "Real-time collaboration",
      "Team workspace",
      "Advanced analytics",
      "SSO & admin controls",
      "Dedicated support",
      "Custom integrations",
    ],
    cta: "Get Team",
    href: "/signup?plan=team",
    highlighted: false,
    color: "from-cyan-500 to-blue-600",
  },
];

export function PricingSection() {
  const [yearly, setYearly] = useState(false);
  const [plans, setPlans] = useState<PlanItem[]>(FALLBACK_PLANS);
  const [pricingMeta, setPricingMeta] = useState({
    badge: "Simple pricing",
    headingLine1: "Choose your plan.",
    headingLine2: "Upgrade anytime.",
    subheading: "Start free. Scale as you grow. No hidden fees.",
    discountText: "-20%",
    footerGuarantee: "All plans include a 7-day money-back guarantee. Cancel anytime.",
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadPricingFromDB() {
      try {
        // ★ DYNAMIC PRICING AND SETTINGS QUERY
        const [pricingRes, settingsRes] = await Promise.all([
          supabase
            .from("pricing")
            .select("*")
            .eq("is_active", true)
            .order("price_monthly", { ascending: true }),
          supabase
            .from("settings")
            .select("key, value")
            .in("key", [
              "pricing_badge",
              "pricing_heading_line1",
              "pricing_heading_line2",
              "pricing_subheading",
              "pricing_discount_tag",
              "pricing_guarantee_text",
            ]),
        ]);

        if (settingsRes.data && settingsRes.data.length > 0) {
          const map: Record<string, string> = {};
          settingsRes.data.forEach((s) => {
            map[s.key] = s.value;
          });

          setPricingMeta((prev) => ({
            badge: map.pricing_badge || prev.badge,
            headingLine1: map.pricing_heading_line1 || prev.headingLine1,
            headingLine2: map.pricing_heading_line2 || prev.headingLine2,
            subheading: map.pricing_subheading || prev.subheading,
            discountText: map.pricing_discount_tag || prev.discountText,
            footerGuarantee: map.pricing_guarantee_text || prev.footerGuarantee,
          }));
        }

        if (pricingRes.data && pricingRes.data.length > 0) {
          const mappedPlans: PlanItem[] = pricingRes.data.map((p) => {
            const planKey = (p.plan_name || "free").toLowerCase();
            const isPro = planKey === "pro";
            const isTeam = planKey === "team";

            let rawFeatures: string[] = [];
            if (Array.isArray(p.features)) {
              rawFeatures = p.features;
            } else if (typeof p.features === "string") {
              try {
                rawFeatures = JSON.parse(p.features);
              } catch {
                rawFeatures = [p.features];
              }
            }

            const monthlyPrice = Number(p.price_monthly) || 0;
            const yearlyPrice = Number(p.price_yearly) 
              ? Math.round(Number(p.price_yearly) / 12) 
              : Math.round(monthlyPrice * 0.8);

            return {
              name: p.plan_name.charAt(0).toUpperCase() + p.plan_name.slice(1),
              description:
                p.description ||
                (isPro
                  ? "For professionals who create often"
                  : isTeam
                  ? "For teams that build together"
                  : "Perfect for trying things out"),
              price: {
                monthly: monthlyPrice,
                yearly: yearlyPrice,
              },
              features: rawFeatures.length > 0 ? rawFeatures : FALLBACK_PLANS.find(fp => fp.name.toLowerCase() === planKey)?.features || [],
              cta: planKey === "free" ? "Start Free" : `Get ${p.plan_name.charAt(0).toUpperCase() + p.plan_name.slice(1)}`,
              href: planKey === "free" ? "/signup" : `/signup?plan=${planKey}`,
              highlighted: isPro,
              color: isPro
                ? "from-pink-500 via-purple-500 to-cyan-500"
                : isTeam
                ? "from-cyan-500 to-blue-600"
                : "from-slate-500 to-slate-700",
            };
          });

          setPlans(mappedPlans);
        }
      } catch (err) {
        console.warn("Failed to load dynamic pricing from DB:", err);
      }
    }

    loadPricingFromDB();
  }, [supabase]);

  return (
    <section id="pricing" className="relative py-24 md:py-32 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="orb orb-blue w-[500px] h-[500px] -top-20 -left-20 opacity-20" />
      <div className="orb orb-purple w-[500px] h-[500px] bottom-0 -right-20 opacity-20" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="pill-badge mb-6">
            <span>{pricingMeta.badge}</span>
          </div>
          <h2 className="hero-heading text-4xl md:text-6xl text-slate-900 dark:text-white mb-6">
            {pricingMeta.headingLine1}
            <br />
            <span className="gradient-text">{pricingMeta.headingLine2}</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-light mb-10">
            {pricingMeta.subheading}
          </p>

          {/* Monthly/Yearly toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                !yearly ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative ${
                yearly ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 text-[10px] font-bold text-white bg-gradient-to-r from-pink-500 to-purple-500 px-2 py-0.5 rounded-full">
                {pricingMeta.discountText}
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className={`relative ${plan.highlighted ? "md:-mt-4" : ""}`}
            >
              {plan.highlighted && (
                <>
                  <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-3xl blur-md opacity-40" />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white text-xs font-semibold">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </div>
                  </div>
                </>
              )}

              <div className={`relative apple-card p-8 h-full flex flex-col ${plan.highlighted ? "border-2 border-transparent" : ""}`}>
                <div className="mb-6">
                  <h3 className="font-display text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-display font-bold text-slate-900 dark:text-white">
                      ${yearly ? plan.price.yearly : plan.price.monthly}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">/mo</span>
                  </div>
                  {yearly && plan.price.yearly > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Billed ${plan.price.yearly * 12}/year
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all group ${
                    plan.highlighted
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02]"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-10">
          {pricingMeta.footerGuarantee}
        </p>
      </div>
    </section>
  );
}