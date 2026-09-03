from fastapi import HTTPException
from app.db.supabase import get_supabase_admin

TIER_LIMITS = {
    "free": {"max_ppts": 5, "max_slides": 10},
    "pro": {"max_ppts": 999999, "max_slides": 30},
    "team": {"max_ppts": 999999, "max_slides": 50},
}

async def verify_user_quota(user_id: str, requested_slides: int = 4):
    """Verifies whether user is allowed to generate a new presentation under their plan limits."""
    supabase = get_supabase_admin()
    
    # 1. Fetch user's active plan
    profile = supabase.table("profiles").select("plan, ppt_count_month").eq("id", user_id).maybe_single().execute()
    if not profile.data:
        return True # Default allow if unauthenticated/guest during dev

    plan = profile.data.get("plan", "free")
    limits = TIER_LIMITS.get(plan, TIER_LIMITS["free"])
    
    # Check max slides limit
    if requested_slides > limits["max_slides"]:
        raise HTTPException(
            status_code=403,
            detail=f"Your {plan.capitalize()} plan supports up to {limits['max_slides']} slides. Please upgrade or reduce slide count."
        )

    # Check monthly quota
    current_count = profile.data.get("ppt_count_month", 0)
    if current_count >= limits["max_ppts"]:
        raise HTTPException(
            status_code=403,
            detail=f"You have reached your monthly limit of {limits['max_ppts']} presentations on the Free plan. Please upgrade to Pro for unlimited generation."
        )

    # Increment usage counter
    supabase.table("profiles").update({"ppt_count_month": current_count + 1}).eq("id", user_id).execute()
    return True