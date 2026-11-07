from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class UserInteraction(Base):
    __tablename__ = "user_interactions"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False, index=True)
    interaction_type = Column(String(50), nullable=False, index=True) # 'interested' (swipe right), 'skip' (swipe left), 'save', 'source_open', 'tap_detail'
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    story = relationship("Story", back_populates="interactions")
