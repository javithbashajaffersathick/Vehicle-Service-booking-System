# backend/app/main.py
"""FastAPI application entry point.

- Loads environment variables via pydantic Settings.
- Configures CORS based on allowed origins.
- Includes all routers from `app.api.__init__` under `/api/v1`.
- Creates DB tables on startup if they do not exist.
- Provides a simple health‑check endpoint.
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api import api_router

app = FastAPI(
    title="AutoCare Service Booking API",
    version="1.0.0",
    description="Backend for the AutoCare vehicle service booking system.",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS – allow configured origin(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routers
app.include_router(api_router)

# Create tables on startup (SQLite will create if missing)
@app.on_event("startup")
async def on_startup():
    # Import all models to ensure they are registered with Base.metadata
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)

@app.get("/", tags=["health"])
async def root():
    return {
        "service": "AutoCare Service Booking API",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs",
        "health_check": "/health",
        "api_prefix": "/api/v1"
    }


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
