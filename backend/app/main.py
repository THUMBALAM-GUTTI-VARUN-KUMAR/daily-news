import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.scheduler import start_scheduler, shutdown_scheduler
from app.api.v1.router import api_router
from app.services.pipeline import PipelineOrchestrator

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_radar")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables, seed sources, start scheduler
    logger.info(f"Initializing {settings.PROJECT_NAME} for {settings.ORGANIZATION}...")
    Base.metadata.create_all(bind=engine)
    
    # Seed default sources in DB
    db = SessionLocal()
    pipeline = PipelineOrchestrator()
    try:
        pipeline.seed_default_sources(db)
        logger.info("Default sources seeded successfully.")
    except Exception as e:
        logger.error(f"Error seeding sources: {e}")
    finally:
        db.close()

    # Start APScheduler
    start_scheduler()
    logger.info("AI RADAR service initialized successfully.")

    yield

    # Shutdown
    logger.info("Shutting down AI RADAR service...")
    shutdown_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Personal AI intelligence application for Varun Foundry",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "organization": settings.ORGANIZATION,
        "version": settings.PROJECT_VERSION
    }

from fastapi.responses import JSONResponse, FileResponse

# If frontend dist exists, serve assets and fallback to index.html for SPA routes
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept /api routes
        if full_path.startswith("api/") or full_path == "api":
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
