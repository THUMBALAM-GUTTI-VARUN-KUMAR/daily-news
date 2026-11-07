import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.story import Story
from app.models.topic_affinity import TopicAffinity
from app.services.ranker import RankerService

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_ranker_interaction_weight_updates(test_db):
    ranker = RankerService()
    story = Story(
        canonical_url="https://openai.com/index/agents",
        original_url="https://openai.com/index/agents",
        title="Agentic Workflows with Swarm",
        normalized_title="agentic workflows with swarm",
        published_at=datetime.utcnow(),
        topics=["ai agents", "swarm", "automation"],
        headline="Agents",
        summary="Summary",
        why_it_matters="Impact"
    )
    test_db.add(story)
    test_db.commit()

    # Swipe Right -> Interested (+1.5)
    ranker.record_interaction(story.id, "interested", test_db)
    aff_agent = test_db.query(TopicAffinity).filter(TopicAffinity.topic == "ai agents").first()
    assert aff_agent is not None
    assert aff_agent.weight == 1.5
    assert aff_agent.interaction_count == 1

    # Save -> Bookmark (+3.0)
    ranker.record_interaction(story.id, "save", test_db)
    test_db.refresh(aff_agent)
    assert aff_agent.weight == 4.5
    assert aff_agent.interaction_count == 2
    assert story.is_saved is True

    # Swipe Left -> Skip (-0.5)
    ranker.record_interaction(story.id, "skip", test_db)
    test_db.refresh(aff_agent)
    assert aff_agent.weight == 4.0

def test_composite_ranking_formula():
    ranker = RankerService(recency_half_life_hours=48.0)
    now = datetime.utcnow()

    story = Story(
        canonical_url="https://example.com/story1",
        original_url="https://example.com/story1",
        title="High Importance Story",
        normalized_title="high importance story",
        published_at=now,
        topics=["robotics"],
        importance_score=0.9,
        novelty_score=0.8,
        headline="Robotics Leap",
        summary="Summary",
        why_it_matters="Impact"
    )
    
    # User loves robotics (affinity = +3.0)
    affinity_map = {"robotics": 3.0}
    score_high = ranker.calculate_story_score(story, affinity_map)

    # User dislikes robotics (affinity = -3.0)
    affinity_map_low = {"robotics": -3.0}
    score_low = ranker.calculate_story_score(story, affinity_map_low)

    assert score_high > score_low
    # Check components: 40% Imp, 30% Rel, 20% Recency, 10% Novelty
    assert 0.0 <= score_high <= 1.0
