import httpx
import trafilatura
from bs4 import BeautifulSoup
from typing import Optional, Dict, Any
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class ContentExtractor:
    def __init__(self):
        self.headers = {
            "User-Agent": settings.USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }

    async def extract_from_url(self, url: str) -> Dict[str, Any]:
        """
        Fetches web page and extracts clean content text, og:image, and title.
        Uses a tight 3.0s timeout so pipeline is blazingly fast.
        """
        extracted = {
            "clean_text": "",
            "image_url": None,
            "read_time_min": 2
        }
        
        try:
            async with httpx.AsyncClient(timeout=3.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=self.headers)
                if resp.status_code != 200:
                    return extracted
                html = resp.text

            # 1. Trafilatura clean content extraction
            clean_text = trafilatura.extract(
                html,
                include_comments=False,
                include_tables=True,
                no_fallback=False
            )
            if clean_text:
                extracted["clean_text"] = clean_text
                # Calculate reading time (~200 words per minute)
                words = len(clean_text.split())
                extracted["read_time_min"] = max(1, round(words / 200))

            # 2. BeautifulSoup metadata extraction for image
            soup = BeautifulSoup(html, "html.parser")
            og_img = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "twitter:image"})
            if og_img and og_img.get("content"):
                extracted["image_url"] = og_img.get("content").strip()

        except Exception as e:
            logger.debug(f"Deep extraction failed for {url}: {e}")

        return extracted
