import httpx
import feedparser
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from app.core.config import settings
from app.services.normalizer import normalize_url, parse_published_date

logger = logging.getLogger(__name__)

# Curated High-Signal Real-World Sources
DEFAULT_SOURCES = [
    {
        "name": "OpenAI News",
        "slug": "openai-news",
        "site_url": "https://openai.com/news/",
        "feed_url": "https://openai.com/news/rss.xml",
        "source_type": "first_party",
        "category_hint": "AI Models",
        "priority": 1.0,
    },
    {
        "name": "Google DeepMind",
        "slug": "google-deepmind",
        "site_url": "https://deepmind.google/discover/blog/",
        "feed_url": "https://deepmind.google/blog/rss.xml",
        "source_type": "first_party",
        "category_hint": "Research",
        "priority": 1.0,
    },
    {
        "name": "Anthropic AI Coverage",
        "slug": "anthropic-news",
        "site_url": "https://www.anthropic.com/news",
        "feed_url": "https://techcrunch.com/tag/anthropic/feed/",
        "source_type": "first_party",
        "category_hint": "AI Models",
        "priority": 0.95,
    },
    {
        "name": "Mistral AI Releases",
        "slug": "mistral-ai",
        "site_url": "https://mistral.ai",
        "feed_url": "https://github.com/mistralai/mistral-inference/releases.atom",
        "source_type": "first_party",
        "category_hint": "AI Models",
        "priority": 0.95,
    },
    {
        "name": "Hugging Face Blog",
        "slug": "huggingface-blog",
        "site_url": "https://huggingface.co/blog",
        "feed_url": "https://huggingface.co/blog/feed.xml",
        "source_type": "first_party",
        "category_hint": "Open-Source Releases",
        "priority": 0.95,
    },
    {
        "name": "arXiv cs.AI (Artificial Intelligence)",
        "slug": "arxiv-cs-ai",
        "site_url": "https://arxiv.org/list/cs.AI/recent",
        "feed_url": "http://export.arxiv.org/rss/cs.AI",
        "source_type": "research",
        "category_hint": "Research",
        "priority": 0.9,
    },
    {
        "name": "arXiv cs.CL (Computation and Language)",
        "slug": "arxiv-cs-cl",
        "site_url": "https://arxiv.org/list/cs.CL/recent",
        "feed_url": "http://export.arxiv.org/rss/cs.CL",
        "source_type": "research",
        "category_hint": "Research",
        "priority": 0.9,
    },
    {
        "name": "vLLM Releases",
        "slug": "vllm-releases",
        "site_url": "https://github.com/vllm-project/vllm",
        "feed_url": "https://github.com/vllm-project/vllm/releases.atom",
        "source_type": "github",
        "category_hint": "Infrastructure",
        "priority": 0.9,
    },
    {
        "name": "Transformers Releases",
        "slug": "transformers-releases",
        "site_url": "https://github.com/huggingface/transformers",
        "feed_url": "https://github.com/huggingface/transformers/releases.atom",
        "source_type": "github",
        "category_hint": "Developer Tools",
        "priority": 0.9,
    },
    {
        "name": "LangChain Releases",
        "slug": "langchain-releases",
        "site_url": "https://github.com/langchain-ai/langchain",
        "feed_url": "https://github.com/langchain-ai/langchain/releases.atom",
        "source_type": "github",
        "category_hint": "AI Agents",
        "priority": 0.85,
    },
    {
        "name": "Ollama Releases",
        "slug": "ollama-releases",
        "site_url": "https://github.com/ollama/ollama",
        "feed_url": "https://github.com/ollama/ollama/releases.atom",
        "source_type": "github",
        "category_hint": "Developer Tools",
        "priority": 0.85,
    },
    {
        "name": "Simon Willison AI Weblog",
        "slug": "simon-willison-ai",
        "site_url": "https://simonwillison.net",
        "feed_url": "https://simonwillison.net/tags/ai.atom",
        "source_type": "tech_news",
        "category_hint": "Developer Tools",
        "priority": 0.85,
    },
    {
        "name": "Ars Technica AI",
        "slug": "ars-technica-ai",
        "site_url": "https://arstechnica.com/tag/ai/",
        "feed_url": "https://arstechnica.com/tag/ai/feed/",
        "source_type": "tech_news",
        "category_hint": "AI Regulation",
        "priority": 0.75,
    }
]

class FeedCollector:
    def __init__(self):
        self.headers = {
            "User-Agent": settings.USER_AGENT,
            "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        }

    async def fetch_feed(self, feed_url: str) -> Optional[str]:
        """Fetches raw feed XML asynchronously with timeout handling."""
        try:
            async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS, follow_redirects=True) as client:
                response = await client.get(feed_url, headers=self.headers)
                if response.status_code == 200:
                    return response.text
                logger.warning(f"Failed to fetch {feed_url}: status {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error fetching feed {feed_url}: {e}")
            return None

    def parse_feed_content(self, raw_xml: str, source_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parses feed XML into normalized item dictionaries."""
        parsed = feedparser.parse(raw_xml)
        items = []

        for entry in parsed.entries:
            title = entry.get("title", "").strip()
            link = entry.get("link", "").strip()
            if not title or not link:
                continue

            canonical = normalize_url(link)
            
            # Extract published date
            published_val = entry.get("published_parsed") or entry.get("updated_parsed") or entry.get("published") or entry.get("updated")
            published_at = parse_published_date(published_val)

            # Extract body snippet / summary
            summary_raw = ""
            if "summary" in entry:
                summary_raw = entry.summary
            elif "description" in entry:
                summary_raw = entry.description
            elif "content" in entry and len(entry.content) > 0:
                summary_raw = entry.content[0].value

            items.append({
                "title": title,
                "original_url": link,
                "canonical_url": canonical,
                "published_at": published_at,
                "raw_snippet": summary_raw,
                "author": entry.get("author", ""),
                "source_slug": source_info.get("slug"),
                "source_name": source_info.get("name"),
                "source_priority": source_info.get("priority", 1.0),
                "category_hint": source_info.get("category_hint")
            })

        return items
