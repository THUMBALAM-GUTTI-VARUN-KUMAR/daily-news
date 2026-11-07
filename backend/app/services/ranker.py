import math
from typing import Dict, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.story import Story
from app.models.topic_affinity import TopicAffinity
from app.models.interaction import UserInteraction

INTERACTION_WEIGHTS = {
    "interested": 1.5,   # Swipe Right
    "skip": -0.5,        # Swipe Left (gentle down-rank)
    "save": 3.0,         # Bookmark
    "source_open": 2.0,  # Read original source
    "tap_detail": 0.5    # Tapped to read details
}

class RankerService:
    def __init__(self, recency_half_life_hours: float = 48.0):
        self.recency_half_life_hours = recency_half_life_hours

    def record_interaction(
        self,
        story_id: int,
        interaction_type: str,
        db: Session
    ) -> List[str]:
        """
        Records the user interaction and updates the TopicAffinity weights
        for every topic tagged in the story.
        Returns the updated topics.
        """
        interaction = UserInteraction(story_id=story_id, interaction_type=interaction_type)
        db.add(interaction)

        story = db.query(Story).filter(Story.id == story_id).first()
        if not story:
            db.commit()
            return []

        if interaction_type == "save":
            story.is_saved = True
        elif interaction_type in ["interested", "skip"]:
            story.is_viewed = True

        weight_delta = INTERACTION_WEIGHTS.get(interaction_type, 0.0)
        updated_topics = []

        if weight_delta != 0.0 and story.topics:
            for raw_topic in story.topics:
                norm_topic = str(raw_topic).strip().lower()
                if not norm_topic:
                    continue
                affinity = db.query(TopicAffinity).filter(TopicAffinity.topic == norm_topic).first()
                if not affinity:
                    affinity = TopicAffinity(topic=norm_topic, weight=0.0, interaction_count=0)
                    db.add(affinity)
                affinity.weight += weight_delta
                affinity.interaction_count += 1
                affinity.updated_at = datetime.utcnow()
                updated_topics.append(norm_topic)

        db.commit()
        return updated_topics

    def get_user_affinity_map(self, db: Session) -> Dict[str, float]:
        """Loads all learned topic weights."""
        affinities = db.query(TopicAffinity).all()
        return {a.topic: a.weight for a in affinities}

    def compute_personal_relevance(self, story_topics: List[str], affinity_map: Dict[str, float]) -> float:
        """
        Calculates personal relevance score (0.0 to 1.0) based on user's topic affinity.
        Uses sigmoid-style normalization.
        """
        if not story_topics or not affinity_map:
            return 0.5 # Neutral baseline

        total_affinity = 0.0
        matches = 0
        for topic in story_topics:
            t_norm = str(topic).strip().lower()
            if t_norm in affinity_map:
                total_affinity += affinity_map[t_norm]
                matches += 1

        if matches == 0:
            return 0.5

        avg_affinity = total_affinity / matches
        # Normalize into 0.0 to 1.0 using logistic function: 1 / (1 + e^(-k * x))
        # Zero affinity maps to 0.5
        relevance = 1.0 / (1.0 + math.exp(-0.8 * avg_affinity))
        return max(0.0, min(1.0, relevance))

    def compute_recency_score(self, published_at: datetime) -> float:
        """
        Exponential decay: 1.0 at publication, decaying with half-life of 48 hours.
        """
        if not published_at:
            return 0.5
        now = datetime.utcnow()
        hours_ago = max(0.0, (now - published_at).total_seconds() / 3600.0)
        # Decay formula: 0.5^(hours / half_life)
        score = math.pow(0.5, hours_ago / self.recency_half_life_hours)
        return max(0.01, min(1.0, score))

    def calculate_story_score(
        self,
        story: Story,
        affinity_map: Dict[str, float]
    ) -> float:
        """
        Weighted Ranking Formula:
        40% Importance
        30% Personal relevance
        20% Recency
        10% Novelty
        """
        importance = story.importance_score or 0.5
        relevance = self.compute_personal_relevance(story.topics or [], affinity_map)
        recency = self.compute_recency_score(story.published_at)
        novelty = story.novelty_score or 0.5

        final_score = (
            0.40 * importance +
            0.30 * relevance +
            0.20 * recency +
            0.10 * novelty
        )
        return round(final_score, 4)

    def rank_stories(self, stories: List[Story], db: Session) -> List[Story]:
        """Ranks a list of stories by calculated composite score descending."""
        affinity_map = self.get_user_affinity_map(db)
        for s in stories:
            s.interaction_score = self.calculate_story_score(s, affinity_map)
        return sorted(stories, key=lambda s: s.interaction_score, reverse=True)
