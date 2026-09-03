from supabase import create_client, Client
from app.core.config import get_settings

settings = get_settings()

def get_supabase_admin() -> Client:
    """Returns a secure Supabase client with admin credentials."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("Supabase URL and Service Role Key must be set in your backend .env file.")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)