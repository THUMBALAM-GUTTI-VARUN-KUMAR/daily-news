from fastapi import APIRouter
from app.api.v1.endpoints import radar, stories, sources, settings

api_router = APIRouter()

api_router.include_router(radar.router, prefix="/radar", tags=["Radar"])
api_router.include_router(stories.router, prefix="/stories", tags=["Stories"])
api_router.include_router(sources.router, prefix="/sources", tags=["Sources"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
