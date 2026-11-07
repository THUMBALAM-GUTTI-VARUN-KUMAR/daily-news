import re
from urllib.parse import urlparse, parse_qs, urlunparse, urlencode
from datetime import datetime, timezone
import dateutil.parser

TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "utm_id", "utm_cid", "utm_reader", "utm_referrer", "utm_name",
    "fbclid", "gclid", "gclsrc", "dclid", "zanpid", "msclkid",
    "ref", "ref_src", "ref_url", "source", "spm", "feature", "context",
    "mbid", "cmpid", "igshid", "mc_cid", "mc_eid"
}

# Regex to remove trailing publisher suffixes like "- TechCrunch", "| OpenAI", etc.
PUBLISHER_SUFFIX_PATTERN = re.compile(
    r'\s+[-|•·–—]\s+(?:OpenAI|Anthropic|Google DeepMind|DeepMind|Google|Meta AI|Meta|Mistral AI|Mistral|Hugging Face|TechCrunch|The Verge|Ars Technica|VentureBeat|MIT Technology Review|Simon Willison|GitHub|Hacker News|Wired).*$',
    re.IGNORECASE
)

def normalize_url(url: str) -> str:
    """
    Canonicalizes URL:
    - Lowercases scheme and host
    - Removes tracking parameters (utm, fbclid, etc.)
    - Removes URL fragments
    - Strips trailing slash on root, retains path
    - Sorts remaining query parameters
    """
    if not url:
        return ""
    
    url = url.strip()
    try:
        parsed = urlparse(url)
        scheme = parsed.scheme.lower()
        netloc = parsed.netloc.lower()
        
        # Remove standard default ports if present
        if ":80" in netloc and scheme == "http":
            netloc = netloc.replace(":80", "")
        elif ":443" in netloc and scheme == "https":
            netloc = netloc.replace(":443", "")
            
        path = parsed.path
        if path.endswith("/") and len(path) > 1:
            path = path[:-1]
            
        # Filter and sort query params canonically
        query_dict = parse_qs(parsed.query, keep_blank_values=False)
        cleaned_params = [
            (k, v) for k, v in sorted(query_dict.items())
            if k.lower() not in TRACKING_PARAMS
        ]
        
        sorted_query = urlencode(cleaned_params, doseq=True)
        # Fragment is removed for canonical comparison
        canonical = urlunparse((scheme, netloc, path, parsed.params, sorted_query, ""))
        return canonical
    except Exception:
        return url

def normalize_title(title: str) -> str:
    """
    Normalizes title for deduplication:
    - Strips publisher suffixes
    - Replaces punctuation with single space
    - Converts to lower case and strips excess whitespace
    """
    if not title:
        return ""
        
    title = title.strip()
    # Strip common publisher suffixes
    title = PUBLISHER_SUFFIX_PATTERN.sub("", title)
    
    # Remove HTML tags if present
    title = re.sub(r'<[^>]+>', ' ', title)
    # Replace non-alphanumeric (except spaces) with space
    title_clean = re.sub(r'[^a-zA-Z0-9\s]', ' ', title)
    # Collapse multiple whitespaces
    title_clean = re.sub(r'\s+', ' ', title_clean).strip().lower()
    return title_clean

def parse_published_date(date_val) -> datetime:
    """
    Converts various date representations (parsed feed struct, iso string, rfc string)
    into a timezone-naive UTC datetime.
    """
    if not date_val:
        return datetime.utcnow()
        
    if isinstance(date_val, datetime):
        if date_val.tzinfo:
            return date_val.astimezone(timezone.utc).replace(tzinfo=None)
        return date_val
        
    try:
        # Handles feedparser time.struct_time or strings
        if hasattr(date_val, 'tm_year'):
            return datetime(
                date_val.tm_year, date_val.tm_mon, date_val.tm_mday,
                date_val.tm_hour, date_val.tm_min, date_val.tm_sec
            )
        parsed_dt = dateutil.parser.parse(str(date_val))
        if parsed_dt.tzinfo:
            return parsed_dt.astimezone(timezone.utc).replace(tzinfo=None)
        return parsed_dt
    except Exception:
        return datetime.utcnow()
