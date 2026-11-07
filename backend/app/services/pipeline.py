import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.source import Source
from app.models.story import Story
from app.models.scan_log import ScanLog
from app.services.collector import FeedCollector, DEFAULT_SOURCES
from app.services.extractor import ContentExtractor
from app.services.normalizer import normalize_url, normalize_title
from app.services.deduplicator import DeduplicatorService
from app.services.classifier import ClassifierService
from app.services.ranker import RankerService
from app.core.config import settings

logger = logging.getLogger(__name__)

class PipelineOrchestrator:
    def __init__(self):
        self.collector = FeedCollector()
        self.extractor = ContentExtractor()
        self.deduplicator = DeduplicatorService()
        self.classifier = ClassifierService()
        self.ranker = RankerService()

    def seed_default_sources(self, db: Session):
        """Seeds initial reputable AI sources into the database if not present, or updates feed URLs."""
        for src_data in DEFAULT_SOURCES:
            existing = db.query(Source).filter(
                (Source.slug == src_data["slug"]) | (Source.feed_url == src_data["feed_url"])
            ).first()
            if not existing:
                src = Source(**src_data)
                db.add(src)
            else:
                existing.feed_url = src_data["feed_url"]
                existing.name = src_data["name"]
                existing.priority = src_data["priority"]
        db.commit()

    async def run_pipeline(self, db: Session) -> ScanLog:
        """
        Executes full 10-step intelligence pipeline:
        Fetch -> Extract -> Normalize -> Deduplicate -> Classify -> Score -> Summarize -> Store -> Rank
        """
        self.seed_default_sources(db)
        
        scan_log = ScanLog(
            scan_started_at=datetime.utcnow(),
            status="running"
        )
        db.add(scan_log)
        db.commit()

        active_sources = db.query(Source).filter(Source.is_active == True).all()
        
        sources_scanned = 0
        failures = 0
        stories_discovered = 0
        duplicates_detected = 0
        important_stories = 0

        raw_candidates = []

        # 1. Fetch & Collect from active sources
        for src in active_sources:
            try:
                xml_text = await self.collector.fetch_feed(src.feed_url)
                if not xml_text:
                    src.failure_count += 1
                    src.last_status = "error_fetching"
                    failures += 1
                    continue

                items = self.collector.parse_feed_content(
                    xml_text,
                    {"slug": src.slug, "name": src.name, "priority": src.priority, "category_hint": src.category_hint}
                )
                src.last_fetched_at = datetime.utcnow()
                src.last_status = "ok"
                src.failure_count = 0
                sources_scanned += 1

                for item in items[:4]: # Process top 4 freshest entries per source
                    item["source_db_id"] = src.id
                    raw_candidates.append(item)

            except Exception as e:
                logger.error(f"Error processing source {src.name}: {e}")
                src.failure_count += 1
                src.last_status = "error"
                failures += 1

        db.commit()

        # 2. Extract, Normalize, Deduplicate, Classify, Score, Summarize, Store
        for cand in raw_candidates[:settings.MAX_STORIES_PER_SCAN]:
            canonical_url = cand["canonical_url"]
            
            # Step A: Canonical URL deduplication check
            if self.deduplicator.is_url_duplicate(canonical_url, db):
                duplicates_detected += 1
                continue

            # Step B: Content-based title & entity deduplication check
            content_dup = self.deduplicator.find_content_duplicate(
                candidate_title=cand["title"],
                candidate_pub_date=cand["published_at"],
                candidate_companies=[],
                candidate_topics=[],
                db=db
            )
            if content_dup:
                existing_story, sim_score = content_dup
                # Check if candidate should supersede existing (e.g. first-party vs secondary)
                if not self.deduplicator.should_replace_with_candidate(
                    existing_story, cand["source_priority"], cand["published_at"]
                ):
                    duplicates_detected += 1
                    continue
                else:
                    # Replace existing secondary story with primary
                    db.delete(existing_story)
                    db.commit()

            # Step C: Deep extract if needed
            extracted_info = await self.extractor.extract_from_url(cand["original_url"])
            full_body = extracted_info.get("clean_text") or cand.get("raw_snippet") or cand["title"]

            # Step D: Classify & Score & Summarize
            classification = await self.classifier.classify_and_summarize(
                title=cand["title"],
                content=full_body,
                source_name=cand["source_name"],
                category_hint=cand.get("category_hint")
            )

            # Skip if explicitly classified as not AI related
            if not classification.is_ai_related:
                continue

            # Step E: Store
            new_story = Story(
                source_id=cand.get("source_db_id"),
                canonical_url=canonical_url,
                original_url=cand["original_url"],
                title=cand["title"],
                normalized_title=normalize_title(cand["title"]),
                published_at=cand["published_at"],
                discovered_at=datetime.utcnow(),
                is_ai_related=classification.is_ai_related,
                category=classification.category,
                sub_category=classification.sub_category,
                companies=classification.companies,
                technologies=classification.technologies,
                topics=classification.topics,
                importance_score=classification.importance_score,
                novelty_score=classification.novelty_score,
                technical_score=classification.technical_score,
                is_breaking=classification.is_breaking,
                headline=classification.headline,
                summary=classification.summary,
                why_it_matters=classification.why_it_matters,
                raw_content=full_body[:10000] if full_body else None,
                image_url=extracted_info.get("image_url"),
                read_time_min=extracted_info.get("read_time_min", 2)
            )

            # Compute initial rank
            affinity_map = self.ranker.get_user_affinity_map(db)
            new_story.interaction_score = self.ranker.calculate_story_score(new_story, affinity_map)

            db.add(new_story)
            db.commit()

            stories_discovered += 1
            if classification.importance_score >= 0.75:
                important_stories += 1

        # Finalize scan log
        scan_log.scan_ended_at = datetime.utcnow()
        scan_log.sources_scanned = sources_scanned
        scan_log.failures = failures
        scan_log.stories_discovered = stories_discovered
        scan_log.duplicates_detected = duplicates_detected
        scan_log.important_stories = important_stories
        scan_log.status = "completed"
        db.commit()

        logger.info(f"Scan finished: {stories_discovered} discovered, {duplicates_detected} dups, {important_stories} high-importance.")
        return scan_log
