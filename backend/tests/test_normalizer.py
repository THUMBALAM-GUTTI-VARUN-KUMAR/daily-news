import pytest
from datetime import datetime
from app.services.normalizer import normalize_url, normalize_title, parse_published_date

def test_normalize_url_strips_tracking():
    dirty_url = "https://openai.com/index/gpt-4o/?utm_source=twitter&utm_medium=social&utm_campaign=launch&ref=hacker-news#section-1"
    clean = normalize_url(dirty_url)
    assert "utm_source" not in clean
    assert "utm_campaign" not in clean
    assert "ref=" not in clean
    assert "#section-1" not in clean
    assert clean == "https://openai.com/index/gpt-4o"

def test_normalize_url_normalizes_host_and_port():
    url = "HTTP://DEEPMIND.GOOGLE:80/discover/blog/?b=2&a=1"
    clean = normalize_url(url)
    assert clean.startswith("http://deepmind.google/discover/blog")
    assert "a=1&b=2" in clean # query params sorted

def test_normalize_title_removes_publisher_suffixes():
    raw_title = "Introducing Claude 3.5 Sonnet | Anthropic"
    norm = normalize_title(raw_title)
    assert "anthropic" not in norm
    assert norm == "introducing claude 3 5 sonnet"

def test_normalize_title_strips_punctuation():
    raw_title = "Meta Releases Llama-3.1: 405B Parameters, Open Weights!"
    norm = normalize_title(raw_title)
    assert norm == "meta releases llama 3 1 405b parameters open weights"

def test_parse_published_date():
    dt_str = "Fri, 07 Mar 2025 14:30:00 GMT"
    parsed = parse_published_date(dt_str)
    assert isinstance(parsed, datetime)
    assert parsed.year == 2025
    assert parsed.month == 3
    assert parsed.day == 7
