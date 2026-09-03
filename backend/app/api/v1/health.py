from fastapi import APIRouter, Depends
from app.core.config import Settings, get_settings
from app.db.supabase import get_supabase_admin

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("/")
async def health_check(settings: Settings = Depends(get_settings)):
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "1.0.0"
    }

@router.get("/db")
async def db_health():
    try:
        supabase = get_supabase_admin()
        res = supabase.table("pricing").select("plan_name").execute()
        return {
            "status": "connected",
            "database": "supabase",
            "plans": [p["plan_name"] for p in res.data]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}