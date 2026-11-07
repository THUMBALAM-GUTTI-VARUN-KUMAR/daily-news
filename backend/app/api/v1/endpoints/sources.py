from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.api.deps import get_db
from app.models.source import Source
from app.models.story import Story
from app.schemas.source import SourceResponse, SourceCreate, SourceUpdate

router = APIRouter()

@router.get("", response_model=List[SourceResponse])
def get_sources(db: Session = Depends(get_db)):
    sources = db.query(Source).order_by(Source.priority.desc(), Source.name).all()
    results = []
    for s in sources:
        count = db.query(func.count(Story.id)).filter(Story.source_id == s.id).scalar() or 0
        resp = SourceResponse.model_validate(s)
        resp.stories_count = count
        results.append(resp)
    return results

@router.post("", response_model=SourceResponse)
def create_custom_source(payload: SourceCreate, db: Session = Depends(get_db)):
    existing = db.query(Source).filter(Source.feed_url == payload.feed_url).first()
    if existing:
        raise HTTPException(status_code=400, detail="Source with this feed URL already exists")

    new_source = Source(**payload.model_dump())
    db.add(new_source)
    db.commit()
    db.refresh(new_source)
    return SourceResponse.model_validate(new_source)

@router.patch("/{source_id}", response_model=SourceResponse)
def update_source(source_id: int, payload: SourceUpdate, db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(source, k, v)

    db.commit()
    db.refresh(source)
    return SourceResponse.model_validate(source)

@router.delete("/{source_id}")
def delete_source(source_id: int, db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    db.delete(source)
    db.commit()
    return {"success": True, "message": "Source removed successfully"}
