import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.story import Story
from app.models.source import Source
from app.services.deduplicator import DeduplicatorService
from app.services.normalizer import normalize_title

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_url_duplicate_detection(test_db):
    dedup = DeduplicatorService()
    story = Story(
        canonical_url="https://openai.com/index/gpt-4o",
        original_url="https://openai.com/index/gpt-4o?utm_source=x",
        title="Hello GPT-4o",
        normalized_title="hello gpt 4o",
        published_at=datetime.utcnow(),
        headline="Hello",
        summary="Summary",
        why_it_matters="Impact"
    )
    test_db.add(story)
    test_db.commit()

    match = dedup.is_url_duplicate("https://openai.com/index/gpt-4o", test_db)
    assert match is not None
    assert match.id == story.id

    no_match = dedup.is_url_duplicate("https://anthropic.com/claude", test_db)
    assert no_match is None

def test_rapidfuzz_content_deduplication(test_db):
    dedup = DeduplicatorService(title_similarity_threshold=80.0)
    now = datetime.utcnow()
    
    story = Story(
        canonical_url="https://techcrunch.com/anthropic-claude-3-5",
        original_url="https://techcrunch.com/anthropic-claude-3-5",
        title="Anthropic Launches Claude 3.5 Sonnet with Artifacts",
        normalized_title=normalize_title("Anthropic Launches Claude 3.5 Sonnet with Artifacts"),
        published_at=now,
        companies=["Anthropic"],
        topics=["ai models", "claude"],
        headline="Anthropic Launches Claude 3.5 Sonnet",
        summary="Summary",
        why_it_matters="Impact"
    )
    test_db.add(story)
    test_db.commit()

    # Candidate with slightly rephrased title and same company
    candidate_title = "Anthropic announces Claude 3.5 Sonnet model featuring Artifacts"
    dup_result = dedup.find_content_duplicate(
        candidate_title=candidate_title,
        candidate_pub_date=now + timedelta(hours=2),
        candidate_companies=["Anthropic"],
        candidate_topics=["ai models"],
        db=test_db
    )
    assert dup_result is not None
    matched_story, sim = dup_result
    assert matched_story.id == story.id
    assert sim >= 75.0

def test_dedup_safeguard_prevents_false_positive_different_companies(test_db):
    dedup = DeduplicatorService(title_similarity_threshold=80.0)
    now = datetime.utcnow()

    story = Story(
        canonical_url="https://openai.com/index/new-model",
        original_url="https://openai.com/index/new-model",
        title="OpenAI Releases Revolutionary Reasoning Model",
        normalized_title=normalize_title("OpenAI Releases Revolutionary Reasoning Model"),
        published_at=now,
        companies=["OpenAI"],
        topics=["reasoning"],
        headline="Headline",
        summary="Summary",
        why_it_matters="Impact"
    )
    test_db.add(story)
    test_db.commit()

    # Highly similar headline but distinct company: Meta
    candidate_title = "Meta Releases Revolutionary Reasoning Model"
    dup_result = dedup.find_content_duplicate(
        candidate_title=candidate_title,
        candidate_pub_date=now,
        candidate_companies=["Meta"],
        candidate_topics=["reasoning"],
        db=test_db
    )
    # Must NOT merge because companies differ completely
    assert dup_result is None
