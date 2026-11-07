import os
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.core.config import settings
from app.core.scheduler import update_scheduler_interval
from app.models.topic_affinity import TopicAffinity
from app.models.setting import SystemSetting
from app.schemas.settings import SettingsResponse, SettingsUpdate

logger = logging.getLogger(__name__)
router = APIRouter()

def persist_to_env_file(key: str, value: str):
    """Write or update key=value in backend/.env file"""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # Walk up to find backend or project root
        backend_dir = current_dir
        while backend_dir and os.path.basename(backend_dir) != "backend":
            parent = os.path.dirname(backend_dir)
            if parent == backend_dir:
                break
            backend_dir = parent

        env_candidates = [
            os.path.join(backend_dir, ".env"),
            os.path.join(os.path.dirname(backend_dir), ".env")
        ]
        target_path = None
        for p in env_candidates:
            if os.path.exists(p):
                target_path = p
                break
        if not target_path:
            target_path = env_candidates[0]

        lines = []
        found = False
        if os.path.exists(target_path):
            with open(target_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip().startswith(f"{key}="):
                        lines.append(f"{key}={value}\n")
                        found = True
                    else:
                        lines.append(line)
        if not found:
            lines.append(f"{key}={value}\n")

        with open(target_path, "w", encoding="utf-8") as f:
            f.writelines(lines)
        logger.info(f"Persisted {key} to {target_path}")
    except Exception as e:
        logger.error(f"Error persisting to .env file: {e}")

@router.get("", response_model=SettingsResponse)
def get_app_settings(db: Session = Depends(get_db)):
    # Check if DB has stored key
    db_key = db.query(SystemSetting).filter(SystemSetting.key == "gemini_api_key").first()
    if db_key and db_key.value and not settings.GEMINI_API_KEY:
        settings.GEMINI_API_KEY = db_key.value

    affinities = db.query(TopicAffinity).order_by(TopicAffinity.weight.desc()).limit(10).all()
    topic_weights = {a.topic: round(a.weight, 2) for a in affinities}
    
    return SettingsResponse(
        project_name=settings.PROJECT_NAME,
        organization=settings.ORGANIZATION,
        scan_interval_minutes=settings.SCAN_INTERVAL_MINUTES,
        gemini_configured=bool(settings.GEMINI_API_KEY),
        gemini_model=settings.GEMINI_MODEL,
        database_url=settings.DATABASE_URL,
        top_interested_topics=topic_weights
    )

@router.post("", response_model=SettingsResponse)
def update_app_settings(payload: SettingsUpdate, db: Session = Depends(get_db)):
    if payload.scan_interval_minutes is not None:
        val = max(1, payload.scan_interval_minutes)
        settings.SCAN_INTERVAL_MINUTES = val
        update_scheduler_interval(val)
        # Store in DB
        db_interval = db.query(SystemSetting).filter(SystemSetting.key == "scan_interval_minutes").first()
        if not db_interval:
            db_interval = SystemSetting(key="scan_interval_minutes", value=str(val))
            db.add(db_interval)
        else:
            db_interval.value = str(val)
        db.commit()

    if payload.gemini_api_key is not None:
        key_val = payload.gemini_api_key.strip()
        settings.GEMINI_API_KEY = key_val
        
        # 1. Store in SQLite DB
        db_key = db.query(SystemSetting).filter(SystemSetting.key == "gemini_api_key").first()
        if not db_key:
            db_key = SystemSetting(key="gemini_api_key", value=key_val)
            db.add(db_key)
        else:
            db_key.value = key_val
        db.commit()

        # 2. Store in .env file
        persist_to_env_file("GEMINI_API_KEY", key_val)
        logger.info("Gemini API key successfully saved to database and .env")

    if payload.gemini_model is not None:
        settings.GEMINI_MODEL = payload.gemini_model

    return get_app_settings(db)

@router.post("/reset-affinities")
def reset_user_affinities(db: Session = Depends(get_db)):
    """Resets learned personalization weights to neutral state."""
    db.query(TopicAffinity).delete()
    db.commit()
    return {"success": True, "message": "Personalization preferences reset to baseline."}
