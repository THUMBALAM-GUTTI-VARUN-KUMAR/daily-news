from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.core.config import settings
from app.core.scheduler import update_scheduler_interval
from app.models.topic_affinity import TopicAffinity
from app.schemas.settings import SettingsResponse, SettingsUpdate

router = APIRouter()

@router.get("", response_model=SettingsResponse)
def get_app_settings(db: Session = Depends(get_db)):
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
        settings.SCAN_INTERVAL_MINUTES = max(1, payload.scan_interval_minutes)
        update_scheduler_interval(settings.SCAN_INTERVAL_MINUTES)

    if payload.gemini_api_key is not None:
        settings.GEMINI_API_KEY = payload.gemini_api_key

    if payload.gemini_model is not None:
        settings.GEMINI_MODEL = payload.gemini_model

    return get_app_settings(db)

@router.post("/reset-affinities")
def reset_user_affinities(db: Session = Depends(get_db)):
    """Resets learned personalization weights to neutral state."""
    db.query(TopicAffinity).delete()
    db.commit()
    return {"success": True, "message": "Personalization preferences reset to baseline."}
