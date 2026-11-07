import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.core.config import settings
from app.core.database import SessionLocal
from app.services.pipeline import PipelineOrchestrator

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()
pipeline = PipelineOrchestrator()

async def scheduled_scan_job():
    """Periodic scan task triggered by APScheduler."""
    logger.info("Executing periodic AI RADAR scan job...")
    db = SessionLocal()
    try:
        await pipeline.run_pipeline(db)
    except Exception as e:
        logger.error(f"Error during scheduled scan: {e}")
    finally:
        db.close()

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            scheduled_scan_job,
            trigger=IntervalTrigger(minutes=settings.SCAN_INTERVAL_MINUTES),
            id="ai_radar_periodic_scan",
            name="Periodic AI Radar Intelligence Scan",
            replace_existing=True
        )
        scheduler.start()
        logger.info(f"APScheduler started with interval {settings.SCAN_INTERVAL_MINUTES} minutes.")

def update_scheduler_interval(minutes: int):
    """Dynamically updates the scan frequency."""
    if scheduler.running:
        scheduler.reschedule_job(
            "ai_radar_periodic_scan",
            trigger=IntervalTrigger(minutes=minutes)
        )
        logger.info(f"APScheduler interval updated to {minutes} minutes.")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler shut down.")
