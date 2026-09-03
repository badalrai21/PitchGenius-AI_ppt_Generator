from app.db.supabase import get_supabase_admin
import logging

logger = logging.getLogger(__name__)

FALLBACK_PROMPT = (
    "You are PitchGenius AI, an elite presentation creation assistant like Gamma AI. "
    "You create professional presentations in valid JSON formats. "
    "Ensure each slide uses a variety of responsive, standard layouts like 'title', 'bullets', "
    "'two_column', 'metrics', 'quote', 'process', or 'timeline'."
)

async def get_prompt_from_db(key: str) -> str:
    """Safely retrieves systemic prompts from database table to prevent hardcoding."""
    try:
        supabase = get_supabase_admin()
        res = supabase.table("prompts").select("content").eq("key", key).eq("is_active", True).execute()
        if res.data and len(res.data) > 0:
            return res.data[0].get("content")
    except Exception as e:
        logger.warning(f"Unable to read systemic prompt '{key}' from DB: {str(e)}. Utilizing fallback.")
    return FALLBACK_PROMPT