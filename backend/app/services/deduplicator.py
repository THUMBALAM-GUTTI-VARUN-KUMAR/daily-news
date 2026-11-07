from typing import List, Optional, Tuple
from datetime import datetime, timedelta
from rapidfuzz import fuzz
from sqlalchemy.orm import Session
from app.models.story import Story
from app.models.source import Source
from app.services.normalizer import normalize_url, normalize_title

class DeduplicatorService:
    def __init__(self, time_window_hours: int = 48, title_similarity_threshold: float = 85.0):
        self.time_window_hours = time_window_hours
        self.title_similarity_threshold = title_similarity_threshold

    def is_url_duplicate(self, canonical_url: str, db: Session) -> Optional[Story]:
        """Checks if a story with the canonical URL already exists."""
        return db.query(Story).filter(Story.canonical_url == canonical_url).first()

    def find_content_duplicate(
        self,
        candidate_title: str,
        candidate_pub_date: datetime,
        candidate_companies: List[str],
        candidate_topics: List[str],
        db: Session
    ) -> Optional[Tuple[Story, float]]:
        """
        Finds a matching duplicate within the time window using RapidFuzz
        and entity checks to prevent false positives.
        Returns (existing_story, similarity_score) if matched, else None.
        """
        candidate_norm_title = normalize_title(candidate_title)
        if not candidate_norm_title:
            return None

        # Scope search to within time_window_hours of publication date
        window_start = candidate_pub_date - timedelta(hours=self.time_window_hours)
        window_end = candidate_pub_date + timedelta(hours=self.time_window_hours)

        recent_stories = (
            db.query(Story)
            .filter(Story.published_at >= window_start, Story.published_at <= window_end)
            .all()
        )

        candidate_company_set = set(c.lower() for c in candidate_companies)
        candidate_topic_set = set(t.lower() for t in candidate_topics)

        best_match = None
        highest_score = 0.0

        for existing in recent_stories:
            # RapidFuzz similarity
            token_sort_score = fuzz.token_sort_ratio(candidate_norm_title, existing.normalized_title)
            token_set_score = fuzz.token_set_ratio(candidate_norm_title, existing.normalized_title)
            
            # token_set_ratio handles paraphrasing and additional qualifier words
            combined_score = max(token_set_score, (token_sort_score * 0.4 + token_set_score * 0.6))

            if combined_score >= self.title_similarity_threshold:
                # Entity safeguard: Never merge if companies are completely discordant
                existing_company_set = set(c.lower() for c in (existing.companies or []))
                if candidate_company_set and existing_company_set:
                    # If both identify companies and have zero intersection, do NOT merge
                    if not candidate_company_set.intersection(existing_company_set):
                        continue

                # Topic overlap check
                existing_topic_set = set(t.lower() for t in (existing.topics or []))
                if candidate_topic_set and existing_topic_set:
                    # High confidence duplicate
                    pass

                if combined_score > highest_score:
                    highest_score = combined_score
                    best_match = existing

        if best_match and highest_score >= self.title_similarity_threshold:
            return best_match, highest_score

        return None

    def should_replace_with_candidate(
        self,
        existing_story: Story,
        candidate_source_priority: float,
        candidate_pub_date: datetime
    ) -> bool:
        """
        Determines whether the new candidate should supersede the existing story.
        Rules:
        - Prefer higher source priority (e.g., first-party 1.0 > tech news 0.5).
        - If equal priority, prefer earlier published timestamp (original reporter).
        """
        existing_priority = existing_story.source.priority if existing_story.source else 0.5
        if candidate_source_priority > existing_priority:
            return True
        elif candidate_source_priority == existing_priority:
            return candidate_pub_date < existing_story.published_at
        return False
