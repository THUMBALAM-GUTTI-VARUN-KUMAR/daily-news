from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    site_url = Column(String(500), nullable=False)
    feed_url = Column(String(500), nullable=False, unique=True)
    source_type = Column(String(50), nullable=False, default="rss") # first_party, research, github, tech_news
    category_hint = Column(String(50), nullable=True)
    priority = Column(Float, default=1.0) # 1.0 (first party) > 0.8 (research) > 0.5 (aggregators)
    is_active = Column(Boolean, default=True)
    last_fetched_at = Column(DateTime, nullable=True)
    last_status = Column(String(50), default="idle")
    failure_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    stories = relationship("Story", back_populates="source", cascade="all, delete-orphan")
