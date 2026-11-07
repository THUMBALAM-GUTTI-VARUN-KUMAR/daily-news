from pydantic import BaseModel
from typing import Optional, Dict

class SettingsResponse(BaseModel):
    project_name: str
    organization: str
    scan_interval_minutes: int
    gemini_configured: bool
    gemini_model: str
    database_url: str
    top_interested_topics: Dict[str, float]

class SettingsUpdate(BaseModel):
    scan_interval_minutes: Optional[int] = None
    gemini_api_key: Optional[str] = None
    gemini_model: Optional[str] = None
