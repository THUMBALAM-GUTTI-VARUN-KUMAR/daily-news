from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

class SourceBase(BaseModel):
    name: str
    slug: str
    site_url: str
    feed_url: str
    source_type: str = "first_party" # first_party, research, github, tech_news
    category_hint: Optional[str] = None
    priority: float = 1.0
    is_active: bool = True

class SourceCreate(SourceBase):
    pass

class SourceUpdate(BaseModel):
    name: Optional[str] = None
    feed_url: Optional[str] = None
    source_type: Optional[str] = None
    priority: Optional[float] = None
    is_active: Optional[bool] = None

class SourceResponse(SourceBase):
    id: int
    last_fetched_at: Optional[datetime] = None
    last_status: str = "idle"
    failure_count: int = 0
    stories_count: Optional[int] = 0

    class Config:
        from_attributes = True
