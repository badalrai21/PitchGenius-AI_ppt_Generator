import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "PitchGenius API"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "pitchgenius-files"

    # AI providers
    GROQ_API_KEY: str = ""
    GOOGLE_GEMINI_API_KEY: str = ""
    HUGGINGFACE_TOKEN: str = ""

    # ★ NEW: Image search APIs
    UNSPLASH_ACCESS_KEY: str = ""
    PEXELS_API_KEY: str = ""

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRO_MONTHLY_PRICE_ID: str = ""
    STRIPE_PRO_YEARLY_PRICE_ID: str = ""
    STRIPE_TEAM_MONTHLY_PRICE_ID: str = ""
    STRIPE_TEAM_YEARLY_PRICE_ID: str = ""

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Limits
    MAX_UPLOAD_SIZE_MB: int = 15
    MAX_PDF_PAGES: int = 35

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

@lru_cache()
def get_settings():
    return Settings()