from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings

# Import all routers
from app.api.v1.health import router as health_router
from app.api.v1.generate import router as generate_router
from app.api.v1.export import router as export_router
from app.api.v1.payments import router as payments_router
from app.api.v1.auth import router as auth_router

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(health_router, prefix="/api/v1/health", tags=["Health"])
app.include_router(generate_router, prefix="/api/v1/generate", tags=["Generate"])
app.include_router(export_router, prefix="/api/v1/export", tags=["Export"])
app.include_router(payments_router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])

@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "status": "running",
        "docs": "/docs",
    }