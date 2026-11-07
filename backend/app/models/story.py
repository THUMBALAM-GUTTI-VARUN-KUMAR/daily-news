from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("sources.id", ondelete="SET NULL"), nullable=True)
    canonical_url = Column(String(1000), unique=True, index=True, nullable=False)
    original_url = Column(String(1000), nullable=False)
    title = Column(String(500), nullable=False)
    normalized_title = Column(String(500), index=True, nullable=False)
    published_at = Column(DateTime, nullable=False, index=True)
    discovered_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Classification & Content
    is_ai_related = Column(Boolean, default=True, index=True)
    category = Column(String(100), default="AI Models", index=True)
    sub_category = Column(String(100), nullable=True)
    companies = Column(JSON, default=list)
    technologies = Column(JSON, default=list)
    topics = Column(JSON, default=list)

    # Scoring (0.0 to 1.0)
    importance_score = Column(Float, default=0.5, index=True)
    novelty_score = Column(Float, default=0.5)
    technical_score = Column(Float, default=0.5)
    is_breaking = Column(Boolean, default=False)

    # Summaries (Synthesized by AI/NLP)
    headline = Column(String(300), nullable=False)
    summary = Column(Text, nullable=False)
    why_it_matters = Column(Text, nullable=False)
    raw_content = Column(Text, nullable=True)
    image_url = Column(String(1000), nullable=True)
    read_time_min = Column(Integer, default=2)

    # Flags & Cache
    is_saved = Column(Boolean, default=False, index=True)
    is_viewed = Column(Boolean, default=False, index=True)
    interaction_score = Column(Float, default=0.0) # computed composite score

    source = relationship("Source", back_populates="stories")
    interactions = relationship("UserInteraction", back_populates="story", cascade="all, delete-orphan")
