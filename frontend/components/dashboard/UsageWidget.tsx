"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Crown, Zap, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UsageWidgetProps {
  profile: any;
  collapsed?: boolean;
}

export function UsageWidget({ profile: initialProfile, collapsed = false }: UsageWidgetProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [liveCount, setLiveProfileCount] = useState<number>(0);
  const [ready, setReady] = useState(false);
  const [planLimitsMap, setPlanLimitsMap] = useState<Record<string, number>>({
    free: 5,
    pro: -1,
    team: -1,
  });

  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    const fetchFreshData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) setReady(true);
          return;
        }

        // 1. Fetch fresh profile details
        const { data: freshProfile } = await supabase
          .from("profiles")
          .select("id, plan, ppt_count_month, ai_credits_used")
          .eq("id", user.id)
          .single();

        if (isMounted) {
          if (freshProfile) {
            setProfile(freshProfile);
          } else if (initialProfile) {
            setProfile(initialProfile);
          }
        }

        // 2. ★ SELF-HEALING: Get actual presentation count directly from DB
        const { count, error } = await supabase
          .from("presentations")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (!error && count !== null && isMounted) {
          setLiveProfileCount(count);
        }

        // 3. ★ DYNAMIC PLAN LIMITS INGESTION: Query live pricing limits from DB
        const { data: pricingData } = await supabase
          .from("pricing")
          .select("plan_name, limits")
          .eq("is_active", true);

        if (pricingData && pricingData.length > 0 && isMounted) {
          const limitsMap: Record<string, number> = {};
          pricingData.forEach((p) => {
            const lim = p.limits as any;
            if (lim && typeof lim.presentations === "number") {
              limitsMap[p.plan_name.toLowerCase()] = lim.presentations;
            }
          });
          setPlanLimitsMap((prev) => ({ ...prev, ...limitsMap }));
        }
      } catch (err) {
        console.error("[UsageWidget] Load error:", err);
      } finally {
        if (isMounted) setReady(true);
      }
    };

    fetchFreshData();

    return () => {
      isMounted = false;
    };
  }, [supabase, initialProfile]);

  // ★ FIXED: Unique Realtime channel instance with clean unmount handling
  useEffect(() => {
    if (!profile?.id) return;

    const channelName = `live_usage_${profile.id}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profile.id}`,
        },
        async (payload) => {
          setProfile(payload.new);

          // Re-fetch the live count as well to sync
          const { count } = await supabase
            .from("presentations")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.id);
          if (count !== null) setLiveProfileCount(count);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, supabase]);

  if (!ready || !profile) {
    return (
      <div className="flex items-center justify-center p-3">
        <div className="w-full h-16 rounded-xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
      </div>
    );
  }

  const plan = (profile.plan || "free").toLowerCase();

  // ★ Use the maximum of DB tracked count vs actual presentations table count
  const used = Math.max(profile.ppt_count_month || 0, liveCount);

  // ★ DYNAMIC LIMIT RESOLUTION
  const maxPresentations = planLimitsMap[plan] !== undefined
    ? planLimitsMap[plan]
    : (plan === "free" ? 5 : -1);

  const isUnlimited = maxPresentations === -1;
  const percent = isUnlimited ? 0 : Math.min(100, Math.round((used / maxPresentations) * 100));
  const remaining = isUnlimited ? 999 : Math.max(0, maxPresentations - used);

  if (collapsed) {
    return (
      <div
        className="w-full flex items-center justify-center p-1"
        title={`${used} / ${isUnlimited ? "∞" : maxPresentations} presentations used`}
      >
        <div className="relative w-8 h-8">
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="3"
              className="dark:stroke-slate-800"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke={percent >= 100 ? "#ef4444" : percent > 75 ? "#f97316" : "#0071e3"}
              strokeWidth="3"
              strokeDasharray={`${Math.min(percent, 100) * 0.942} 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-700 dark:text-slate-300">
            {isUnlimited ? "∞" : used}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "14px",
        backgroundColor: "rgba(0,0,0,0.025)",
        border: "1px solid rgba(0,0,0,0.05)",
      }}
      className="dark:bg-slate-900/40 dark:border-slate-800/60"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {plan === "free" ? (
            <Zap style={{ width: "13px", height: "13px", color: "#8e8e93" }} />
          ) : (
            <Crown style={{ width: "13px", height: "13px", color: "#ff9500" }} />
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {plan} Plan
          </span>
        </div>
        {plan === "free" && (
          <Link
            href="/dashboard/upgrade"
            className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
          >
            Upgrade
          </Link>
        )}
      </div>

      <div className="mb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold font-display text-slate-900 dark:text-white leading-none">
            {used}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            / {isUnlimited ? "∞" : maxPresentations} used
          </span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
          {isUnlimited
            ? "Unlimited creations active"
            : remaining === 0
              ? "Monthly limit reached"
              : `${remaining} presentation${remaining === 1 ? "" : "s"} left`}
        </p>
      </div>

      {!isUnlimited && (
        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(percent, 100)}%`,
              background: percent >= 100
                ? "linear-gradient(90deg, #f97316, #ef4444)"
                : percent > 75
                  ? "linear-gradient(90deg, #eab308, #f97316)"
                  : "linear-gradient(90deg, #0071e3, #00B4D8)",
            }}
          />
        </div>
      )}

      {plan === "free" && (
        <Link
          href="/dashboard/upgrade"
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold text-white transition-opacity shadow-sm"
          style={{
            background: "linear-gradient(135deg, #0071e3 0%, #00B4D8 100%)",
            boxShadow: "0 2px 8px rgba(0, 113, 227, 0.25)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <Sparkles className="w-3 h-3 text-white" />
          <span>Get Unlimited</span>
        </Link>
      )}
    </div>
  );
}