from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import List, Optional

from app.api.deps import get_db
from app.models.story import Story
from app.schemas.story import StoryResponse, StoryDetail
from app.services.ranker import RankerService

router = APIRouter()
ranker = RankerService()

@router.get("", response_model=List[StoryResponse])
def get_stories(
    tab: str = Query("for_you", description="'for_you', 'trending', 'saved', 'all'"),
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 30,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Story).filter(Story.is_ai_related == True)

    if category:
        query = query.filter(Story.category == category)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Story.title.ilike(search_fmt),
                Story.headline.ilike(search_fmt),
                Story.summary.ilike(search_fmt)
            )
        )

    if tab == "saved":
        query = query.filter(Story.is_saved == True).order_by(desc(Story.discovered_at))
        stories = query.offset(offset).limit(limit).all()
        return [StoryResponse.model_validate(s) for s in stories]

    elif tab == "trending":
        # Trending: High importance, high technical/novelty, recent
        stories = query.order_by(desc(Story.importance_score), desc(Story.published_at)).offset(offset).limit(limit).all()
        return [StoryResponse.model_validate(s) for s in stories]

    elif tab == "for_you":
        # Ranked by personalized topic affinity formula
        all_matches = query.all()
        ranked = ranker.rank_stories(all_matches, db)
        paged = ranked[offset : offset + limit]
        return [StoryResponse.model_validate(s) for s in paged]

    else:
        stories = query.order_by(desc(Story.published_at)).offset(offset).limit(limit).all()
        return [StoryResponse.model_validate(s) for s in stories]

@router.get("/{story_id}", response_model=StoryDetail)
def get_story_detail(story_id: int, db: Session = Depends(get_db)):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    # Log tap_detail interaction
    ranker.record_interaction(story_id, "tap_detail", db)
    
    resp = StoryDetail.model_validate(story)
    resp.source_name = story.source.name if story.source else "Curated"
    return resp

@router.post("/{story_id}/save")
def toggle_save_story(story_id: int, db: Session = Depends(get_db)):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    story.is_saved = not story.is_saved
    if story.is_saved:
        ranker.record_interaction(story_id, "save", db)
    db.commit()

    return {"success": True, "story_id": story_id, "is_saved": story.is_saved}
