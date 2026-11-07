from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from app.core.database import Base

class ScanLog(Base):
    __tablename__ = "scan_logs"

    id = Column(Integer, primary_key=True, index=True)
    scan_started_at = Column(DateTime, default=datetime.utcnow, index=True)
    scan_ended_at = Column(DateTime, nullable=True)
    sources_scanned = Column(Integer, default=0)
    failures = Column(Integer, default=0)
    stories_discovered = Column(Integer, default=0)
    duplicates_detected = Column(Integer, default=0)
    important_stories = Column(Integer, default=0)
    status = Column(String(50), default="running") # 'running', 'completed', 'failed'
    error_details = Column(Text, nullable=True)
