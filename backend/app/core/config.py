from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI RADAR"
    PROJECT_VERSION: str = "1.0.0"
    ORGANIZATION: str = "Varun Foundry"
    DATABASE_URL: str = "sqlite:///./ai_radar.db"
    GEMINI_API_KEY: Optional[str] = Field(default=None, validation_alias="GEMINI_API_KEY")
    GEMINI_MODEL: str = "gemini-2.5-flash"
    SCAN_INTERVAL_MINUTES: int = 10
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    ENVIRONMENT: str = "development"
    MAX_STORIES_PER_SCAN: int = 50
    REQUEST_TIMEOUT_SECONDS: float = 12.0
    USER_AGENT: str = "AI-Radar-Crawler/1.0 (+https://varunfoundry.com; contact: varun@varunfoundry.com)"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
