import { createClient } from "@/lib/supabase/client";

// ═══════════════════════════════════════════════════════════════
// Dynamic In-memory cache for plan limits (5-minute TTL)
// ═══════════════════════════════════════════════════════════════
export interface PlanLimitData {
  presentations: number;
  maxSlidesPerDeck: number;
  aiCredits: number;
  features: string[];
}

let _planCache: Record<string, PlanLimitData> = {};
let _cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Default fallback (used ONLY if database is temporarily unreachable)
const FALLBACK_LIMITS: Record<string, PlanLimitData> = {
  free: {
    presentations: 5,
    maxSlidesPerDeck: 10,
    aiCredits: 5,
    features: [
      "5 presentations/month",
      "Up to 10 slides/deck",
      "Standard AI",
      "Basic themes",
      "Export with watermark",
    ],
  },
  pro: {
    presentations: -1,
    maxSlidesPerDeck: 30,
    aiCredits: 200,
    features: [
      "Unlimited presentations",
      "Up to 30 slides/deck",
      "Priority AI",
      "All themes",
      "No watermark",
    ],
  },
  team: {
    presentations: -1,
    maxSlidesPerDeck: 50,
    aiCredits: 1000,
    features: [
      "Everything in Pro",
      "Up to 50 slides/deck",
      "10 team seats",
      "Real-time collab",
      "Dedicated support",
    ],
  },
};

// Exported for backward compatibility with modal/UI references
export const PLAN_LIMITS = new Proxy(FALLBACK_LIMITS, {
  get(target, prop: string) {
    if (_planCache[prop]) {
      return _planCache[prop];
    }
    return target[prop] || target.free;
  },
});

/**
 * Fetches plan limits dynamically from the Supabase `pricing` table.
 * Caches results in memory for 5 minutes.
 */
export async function loadPlanLimitsFromDB(): Promise<Record<string, PlanLimitData>> {
  const now = Date.now();

  // Return cached if fresh
  if (Object.keys(_planCache).length > 0 && now - _cacheTimestamp < CACHE_TTL_MS) {
    return _planCache;
  }

  try {
    const supabase = createClient();
    const { data: plans, error } = await supabase
      .from("pricing")
      .select("plan_name, price_monthly, price_yearly, features, limits, is_active")
      .eq("is_active", true);

    if (error || !plans || plans.length === 0) {
      console.warn("[Quota] Could not load pricing from DB, using fallback:", error?.message);
      _planCache = FALLBACK_LIMITS;
      _cacheTimestamp = now;
      return _planCache;
    }

    const result: Record<string, PlanLimitData> = {};

    for (const plan of plans) {
      const limits = (plan.limits as any) || {};
      const features = Array.isArray(plan.features) ? plan.features : [];
      const planKey = (plan.plan_name || "").toLowerCase();

      result[planKey] = {
        presentations: limits.presentations ?? (planKey === "free" ? 5 : -1),
        maxSlidesPerDeck: limits.max_slides_per_deck ?? (planKey === "free" ? 10 : 30),
        aiCredits: limits.ai_credits ?? (planKey === "free" ? 5 : 200),
        features: features.length > 0 ? features : FALLBACK_LIMITS[planKey]?.features || [],
      };
    }

    // Ensure "free" is always present
    if (!result.free) {
      result.free = FALLBACK_LIMITS.free;
    }

    _planCache = result;
    _cacheTimestamp = now;
    return result;
  } catch (err) {
    console.error("[Quota] Exception loading plan limits:", err);
    _planCache = FALLBACK_LIMITS;
    _cacheTimestamp = now;
    return _planCache;
  }
}

/**
 * Synchronous getter — uses cached data or default fallback.
 */
export function getPlanLimit(plan: string): PlanLimitData {
  const key = (plan || "free").toLowerCase();
  return _planCache[key] || _planCache.free || FALLBACK_LIMITS.free;
}

/**
 * Returns the full cached limits map.
 */
export function getAllPlanLimits(): Record<string, PlanLimitData> {
  return Object.keys(_planCache).length > 0 ? _planCache : FALLBACK_LIMITS;
}

export function isOverQuota(plan: string, used: number): boolean {
  const limit = getPlanLimit(plan);
  if (limit.presentations === -1) return false;
  return used >= limit.presentations;
}

export function getRemainingCredits(plan: string, used: number): number {
  const limit = getPlanLimit(plan);
  if (limit.presentations === -1) return Infinity;
  return Math.max(0, limit.presentations - used);
}

export function getUsagePercent(plan: string, used: number): number {
  const limit = getPlanLimit(plan);
  if (limit.presentations === -1) return 0;
  return Math.min(100, Math.round((used / limit.presentations) * 100));
}

/**
 * Force-clear the cache (call after checkout or subscription events)
 */
export function invalidatePlanCache(): void {
  _planCache = {};
  _cacheTimestamp = 0;
}