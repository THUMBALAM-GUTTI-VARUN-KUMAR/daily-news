from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional
from datetime import datetime

class StoryBase(BaseModel):
    title: str
    headline: str
    summary: str
    why_it_matters: str
    canonical_url: str
    original_url: str
    category: str
    sub_category: Optional[str] = None
    companies: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)
    topics: List[str] = Field(default_factory=list)
    importance_score: float = Field(ge=0.0, le=1.0, default=0.5)
    novelty_score: float = Field(ge=0.0, le=1.0, default=0.5)
    technical_score: float = Field(ge=0.0, le=1.0, default=0.5)
    is_breaking: bool = False
    is_ai_related: bool = True
    image_url: Optional[str] = None
    read_time_min: int = 2

class StoryCreate(StoryBase):
    normalized_title: str
    published_at: datetime
    source_id: Optional[int] = None
    raw_content: Optional[str] = None

class StoryResponse(StoryBase):
    id: int
    source_id: Optional[int] = None
    source_name: Optional[str] = None
    published_at: datetime
    discovered_at: datetime
    is_saved: bool = False
    is_viewed: bool = False
    computed_rank: Optional[float] = None

    class Config:
        from_attributes = True

class StoryDetail(StoryResponse):
    raw_content: Optional[str] = None

class StoryClassificationResult(BaseModel):
    is_ai_related: bool = True
    category: str = "AI Models"
    sub_category: Optional[str] = None
    companies: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)
    topics: List[str] = Field(default_factory=list)
    importance_score: float = Field(ge=0.0, le=1.0, default=0.7)
    novelty_score: float = Field(ge=0.0, le=1.0, default=0.7)
    technical_score: float = Field(ge=0.0, le=1.0, default=0.7)
    is_breaking: bool = False
    headline: str
    summary: str
    why_it_matters: str
