import re
import json
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.core.config import settings
from app.schemas.story import StoryClassificationResult

logger = logging.getLogger(__name__)

# Valid standardized categories
ALLOWED_CATEGORIES = [
    "AI Models",
    "AI Agents",
    "APIs & SDKs",
    "Research & Papers",
    "Open-Source Releases",
    "Developer Tools",
    "Robotics",
    "Infrastructure & Chips",
    "AI Security & Alignment",
    "Regulation & Policy",
    "Major Pricing / API Changes"
]

COMMON_COMPANIES = [
    "OpenAI", "Anthropic", "Google DeepMind", "DeepMind", "Google", "Meta",
    "Mistral", "Microsoft", "NVIDIA", "Amazon", "Apple", "xAI", "Cohere",
    "Hugging Face", "Scale AI", "Perplexity", "Groq", "Databricks", "Stability AI"
]

COMMON_TECH = [
    "GPT-4o", "Claude 3.5 Sonnet", "Gemini 1.5 Pro", "Gemini 2.5", "Llama 3", "Llama 3.1",
    "Mistral Large", "vLLM", "Ollama", "LangChain", "LlamaIndex", "PyTorch", "JAX",
    "Triton", "CUDA", "Diffusion", "Transformers", "RLHF", "DPO", "Mamba", "RAG", "MCP"
]

class ClassifierService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.gemini_client = None
        self.consecutive_failures = 0
        self.circuit_open_until = 0.0
        self._init_gemini()

    def _init_gemini(self):
        if self.api_key:
            try:
                from google import genai
                self.gemini_client = genai.Client(
                    api_key=self.api_key,
                    http_options={"api_version": "v1beta"}
                )
                logger.info("Google GenAI client initialized with v1beta API.")
            except Exception as e:
                logger.warning(f"Could not initialize google.genai: {e}. Fallback heuristics active.")

    async def classify_and_summarize(
        self,
        title: str,
        content: str,
        source_name: str,
        category_hint: Optional[str] = None
    ) -> StoryClassificationResult:
        """
        Processes an extracted article through Gemini.
        If Gemini fails or circuit is open, uses the heuristic analysis engine.
        """
        import time
        now = time.time()

        # Try Gemini first if client is available and circuit is closed
        if self.gemini_client and now > self.circuit_open_until:
            try:
                result = await self._classify_with_gemini(title, content, source_name)
                if result:
                    self.consecutive_failures = 0
                    return result
            except Exception as e:
                self.consecutive_failures += 1
                logger.warning(f"Gemini classification issue: {e}. Failure count: {self.consecutive_failures}")
                if self.consecutive_failures >= 2:
                    self.circuit_open_until = now + 90.0 # Pause Gemini calls for 90s to respect rate limits
                    logger.info("Gemini circuit opened for 90s. Using high-signal heuristic classifier.")

        # Heuristic / Local NLP Fallback
        return self._classify_with_heuristics(title, content, source_name, category_hint)

    async def _classify_with_gemini(self, title: str, content: str, source_name: str) -> Optional[StoryClassificationResult]:
        import asyncio
        from google.genai import types
        
        prompt = f"""
You are the AI Intelligence Classification Engine for AI RADAR by Varun Foundry.
Analyze the following collected AI news article:

SOURCE: {source_name}
TITLE: {title}
CONTENT SNIPPET: {content[:3500]}

Analyze and return STRICT JSON with these exact fields:
{{
  "is_ai_related": true/false,
  "category": One of {json.dumps(ALLOWED_CATEGORIES)},
  "sub_category": "Short string (e.g. Reasoning Models, Agentic Frameworks, Benchmarks)",
  "companies": ["Array of mentioned tech companies/labs"],
  "technologies": ["Array of specific models, architectures, libraries"],
  "topics": ["Array of 3-5 normalized lower-case search tags"],
  "importance_score": float between 0.0 and 1.0 (Down-rank generic tutorials, SEO content, marketing filler, unsupported speculation. Up-rank breakthrough models, major research, agent breakthroughs, high-impact infra/APIs),
  "novelty_score": float between 0.0 and 1.0 (How new or original this is),
  "technical_score": float between 0.0 and 1.0 (Depth of architectural/engineering technical substance),
  "is_breaking": true/false (Set true only if this is an urgent top-tier ecosystem event),
  "headline": "Crisp punchy headline of MAXIMUM 15 words",
  "summary": "1 to 3 concise, information-dense sentences explaining what happened.",
  "why_it_matters": "Exactly ONE strong sentence explaining the strategic or engineering impact."
}}
"""
        def _call_sync():
            return self.gemini_client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                )
            )

        response = await asyncio.to_thread(_call_sync)
        if response and response.text:
            data = json.loads(response.text)
            if data.get("category") not in ALLOWED_CATEGORIES:
                data["category"] = "AI Models"
            return StoryClassificationResult(**data)
        return None

    def _classify_with_heuristics(
        self,
        title: str,
        content: str,
        source_name: str,
        category_hint: Optional[str] = None
    ) -> StoryClassificationResult:
        """
        High-signal deterministic heuristic classifier and summarizer.
        Guarantees 100% availability, correct schema, down-ranking SEO,
        and producing max-15-word headlines and concise takeaways.
        """
        full_text = f"{title} {content}".lower()

        # Detect companies
        detected_companies = []
        for comp in COMMON_COMPANIES:
            if re.search(rf"\b{re.escape(comp.lower())}\b", full_text):
                detected_companies.append(comp)

        # Detect tech
        detected_tech = []
        for tech in COMMON_TECH:
            if re.search(rf"\b{re.escape(tech.lower())}\b", full_text):
                detected_tech.append(tech)

        # Determine category
        category = category_hint or "AI Models"
        if any(w in full_text for w in ["agent", "multi-agent", "workflow", "autonomous", "swarm"]):
            category = "AI Agents"
        elif any(w in full_text for w in ["paper", "arxiv", "theorem", "architecture", "dataset", "ablation"]):
            category = "Research & Papers"
        elif any(w in full_text for w in ["release", "v0.", "v1.", "v2.", "weights", "checkpoint", "github"]):
            category = "Open-Source Releases"
        elif any(w in full_text for w in ["sdk", "api", "endpoint", "pricing", "rate limit", "token limit"]):
            category = "APIs & SDKs"
        elif any(w in full_text for w in ["gpu", "cluster", "h100", "b200", "tpu", "inference engine", "cuda", "vllm"]):
            category = "Infrastructure & Chips"
        elif any(w in full_text for w in ["robot", "humanoid", "actuator", "locomotion", "manipulation"]):
            category = "Robotics"
        elif any(w in full_text for w in ["jailbreak", "prompt injection", "safety", "alignment", "cve"]):
            category = "AI Security & Alignment"
        elif any(w in full_text for w in ["regulation", "copyright", "eu ai act", "policy", "ftc"]):
            category = "Regulation & Policy"

        # Calculate scores
        importance = 0.65
        if category in ["AI Models", "AI Agents", "Open-Source Releases"]:
            importance += 0.15
        if any(c in detected_companies for c in ["OpenAI", "Anthropic", "Google DeepMind", "Meta"]):
            importance += 0.1
        # Down-rank tutorials / SEO
        if any(w in full_text for w in ["how to", "tutorial", "top 10", "beginner", "guide to using", "sponsored"]):
            importance -= 0.35
        importance = max(0.1, min(0.99, importance))

        novelty = 0.70
        technical = 0.65 if ("paper" in full_text or "code" in full_text or "weights" in full_text) else 0.50

        # Create topics
        topics = list(set([category.lower()] + [c.lower() for c in detected_companies] + [t.lower() for t in detected_tech]))[:5]
        if not topics:
            topics = ["artificial intelligence", "machine learning"]

        # Clean headline (<= 15 words)
        words = title.split()
        if len(words) <= 2 and source_name:
            headline = f"{source_name}: {title}"
        else:
            headline = " ".join(words[:15])

        # Summary sentences
        cleaned_content = re.sub(r'\s+', ' ', content).strip()
        sentences = [s.strip() for s in re.split(r'[.!?]+', cleaned_content) if len(s.strip()) > 20]
        if sentences:
            summary = ". ".join(sentences[:2]) + "."
        else:
            summary = f"{title}. Discovered from {source_name}."

        why_it_matters = f"Significantly impacts {category.lower()} workflows and competitive capability across the AI landscape."

        return StoryClassificationResult(
            is_ai_related=True,
            category=category,
            sub_category=category,
            companies=detected_companies[:4],
            technologies=detected_tech[:4],
            topics=topics,
            importance_score=round(importance, 2),
            novelty_score=round(novelty, 2),
            technical_score=round(technical, 2),
            is_breaking=(importance >= 0.88),
            headline=headline,
            summary=summary[:400],
            why_it_matters=why_it_matters
        )
