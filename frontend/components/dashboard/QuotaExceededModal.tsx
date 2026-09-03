"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Check, Sparkles, Zap, ArrowRight, TrendingUp, Users } from "lucide-react";
import { UpgradeButton } from "@/components/dashboard/UpgradeButton";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface QuotaExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  used: number;
}

export function QuotaExceededModal({ isOpen, onClose, currentPlan, used }: QuotaExceededModalProps) {
  const supabase = createClient();

  // ★ DYNAMIC DB CONFIGURATION STATES
  const [freeLimit, setFreeLimit] = useState<number>(5);
  const [proPrice, setProPrice] = useState<number>(9);
  const [proFeatures, setProFeatures] = useState<string[]>([
    "Unlimited presentations",
    "Up to 30 slides/deck",
    "Priority AI response",
    "Remove watermark"
  ]);
  const [metrics, setMetrics] = useState({
    users: "10,000+",
    rating: "4.9/5",
    speed: "30s"
  });

  useEffect(() => {
    if (!isOpen) return;

    async function loadPricingAndMetrics() {
      try {
        // 1. Query pricing configurations
        const { data: pricingData } = await supabase
          .from("pricing")
          .select("plan_name, price_monthly, features, limits")
          .eq("is_active", true);

        if (pricingData && pricingData.length > 0) {
          const freePlan = pricingData.find((p) => p.plan_name.toLowerCase() === "free");
          const proPlan = pricingData.find((p) => p.plan_name.toLowerCase() === "pro");

          if (freePlan?.limits) {
            const freeLimitsObj = freePlan.limits as any;
            if (typeof freeLimitsObj.presentations === "number") {
              setFreeLimit(freeLimitsObj.presentations);
            }
          }

          if (proPlan) {
            if (typeof proPlan.price_monthly === "number") {
              setProPrice(proPlan.price_monthly);
            }
            if (Array.isArray(proPlan.features) && proPlan.features.length > 0) {
              setProFeatures(proPlan.features);
            }
          }
        }

        // 2. Query metric settings
        const { data: settingsData } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["metric_users_count", "metric_rating_score", "metric_avg_generation"]);

        if (settingsData && settingsData.length > 0) {
          const metricsUpdate = { ...metrics };
          settingsData.forEach((s) => {
            if (s.key === "metric_users_count" && s.value) metricsUpdate.users = s.value;
            if (s.key === "metric_rating_score" && s.value) metricsUpdate.rating = s.value;
            if (s.key === "metric_avg_generation" && s.value) metricsUpdate.speed = s.value;
          });
          setMetrics(metricsUpdate);
        }
      } catch (err) {
        console.warn("Failed to retrieve dynamic settings for QuotaExceededModal:", err);
      }
    }

    loadPricingAndMetrics();
  }, [isOpen, supabase]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>

            {/* Hero gradient header */}
            <div className="relative p-8 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-widest mb-4">
                  <Zap className="w-3.5 h-3.5" />
                  Free tier limit reached
                </div>

                <h2 className="text-3xl md:text-4xl font-bold font-display mb-2">
                  You've used all {freeLimit} presentations
                </h2>
                <p className="text-white/90 text-sm max-w-lg">
                  Upgrade to <strong>PitchGenius Pro</strong> for unlimited AI-generated presentations and premium features.
                </p>

                {/* Progress showing 5/5 used */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 max-w-xs">
                    <div className="flex justify-between text-xs font-bold text-white/80 mb-1">
                      <span>Monthly usage</span>
                      <span>{used} / {freeLimit}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Pro benefits */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Pro benefits
                    </h3>
                  </div>
                  <ul className="space-y-2.5">
                    {proFeatures.slice(0, 5).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-emerald-500" strokeWidth={3} />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right: Pricing card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border border-cyan-100 dark:border-cyan-950/50">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider mb-3">
                      <Sparkles className="w-2.5 h-2.5" />
                      Most Popular
                    </div>
                    <h4 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
                      PitchGenius Pro
                    </h4>
                    <div className="flex items-baseline justify-center gap-1 mt-2">
                      <span className="text-4xl font-bold font-display text-slate-900 dark:text-white">${proPrice}</span>
                      <span className="text-sm text-slate-500">/month</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Cancel anytime</p>
                  </div>

                  <UpgradeButton
                    plan="pro"
                    label="Upgrade to Pro Now"
                    interval="monthly"
                    variant="gradient"
                  />

                  <Link
                    href="/dashboard/upgrade"
                    onClick={onClose}
                    className="w-full mt-2 py-2 px-4 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    View all plans
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Bottom trust indicators */}
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-4 text-center">
                <div>
                  <Users className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
                  <p className="text-[10px] font-bold text-slate-900 dark:text-white">{metrics.users}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">Users</p>
                </div>
                <div>
                  <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                  <p className="text-[10px] font-bold text-slate-900 dark:text-white">{metrics.rating}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">Rating</p>
                </div>
                <div>
                  <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <p className="text-[10px] font-bold text-slate-900 dark:text-white">{metrics.speed}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">Avg gen</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}