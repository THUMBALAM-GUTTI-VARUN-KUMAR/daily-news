from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.core.database import Base

class TopicAffinity(Base):
    __tablename__ = "topic_affinities"

    topic = Column(String(100), primary_key=True, index=True)
    weight = Column(Float, default=0.0) # updated positively or negatively by user interactions
    interaction_count = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
