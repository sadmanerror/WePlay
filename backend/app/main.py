from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.core.config import settings
from app.core.database import async_engine, Base
from app.api.v1.api import api_router
from app.api.v1.endpoints.ws import router as ws_router
from app.models import (
    Sport, User, Match, MatchParticipant, Message,
    Venue, VenueSlot, VenueReservation, Follow
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure PostGIS extension and tables exist
    async with async_engine.begin() as conn:
        try:
            if conn.dialect.name == "postgresql":
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        except Exception as e:
            print(f"Warning on PostGIS extension check: {e}")

        # Create all tables if they don't exist yet
        await conn.run_sync(Base.metadata.create_all)

        # Seed default sports if empty
        try:
            res = await conn.execute(text("SELECT COUNT(*) FROM sports;"))
            count = res.scalar()
            if count == 0:
                await conn.execute(
                    text("""
                    INSERT INTO sports (id, name, emoji, color) VALUES
                    ('cricket', 'Cricket', '🏏', '#10b981'),
                    ('football', 'Football', '⚽', '#3b82f6'),
                    ('basketball', 'Basketball', '🏀', '#f97316'),
                    ('badminton', 'Badminton', '🏸', '#8b5cf6')
                    ON CONFLICT (id) DO NOTHING;
                    """)
                )
        except Exception as e:
            print(f"Notice on default sports initialization: {e}")

    yield

    # Shutdown
    await async_engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount WebSockets
app.include_router(ws_router, prefix="/ws")


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to Weplay API — Hyper-local sports match discovery",
        "docs": f"{settings.API_V1_STR}/docs",
    }
