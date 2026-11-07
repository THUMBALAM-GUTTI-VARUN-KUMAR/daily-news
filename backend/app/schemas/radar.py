from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from app.schemas.story import StoryResponse

class InteractionRequest(BaseModel):
    story_id: int
    interaction_type: str = Field(..., description="'interested', 'skip', 'save', 'source_open', 'tap_detail'")

class InteractionResponse(BaseModel):
    success: bool
    story_id: int
    interaction_type: str
    updated_topics: List[str] = Field(default_factory=list)

class RadarStats(BaseModel):
    radar_active: bool = True
    sources_count: int = 0
    active_sources_count: int = 0
    last_scan_time: Optional[datetime] = None
    last_scan_status: str = "idle"
    stories_discovered_today: int = 0
    duplicates_blocked_today: int = 0
    important_stories_count: int = 0
    signal_accuracy_pct: float = 98.4
    topic_weights: Dict[str, float] = Field(default_factory=dict)
    swipes_today: int = 0

class ScanTriggerResponse(BaseModel):
    status: str
    message: str
    scan_id: Optional[int] = None
