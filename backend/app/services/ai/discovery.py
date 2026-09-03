"""
Industry-Grade Dynamic Model Discovery Service
- Queries each AI provider's live API to fetch actively available models
- Ranks models by capability score (context window, params, recency)
- Filters out embeddings, whisper, guard, vision-only, and deprecated models
- Caches results for 1 hour to avoid repeated API calls
- Provides graceful degradation across provider outages
"""

import httpx
import time
import re
from typing import List, Optional, Dict
from app.core.config import get_settings

settings = get_settings()

# In-memory cache with 1-hour TTL
_model_cache: Dict[str, Dict] = {}
CACHE_TTL_SECONDS = 3600


class ModelDiscoveryService:
    """
    Dynamically discovers the best available AI model per provider.
    Ranks models by capability score computed from name patterns.
    """

    # Blacklist patterns — exclude non-text-completion models
    BLACKLIST_PATTERNS = [
        r"whisper",       # Speech-to-text
        r"tts",           # Text-to-speech
        r"embed",         # Embeddings
        r"guard",         # Content moderation
        r"vision",        # Vision-only
        r"image",         # Image generation
        r"audio",         # Audio processing
        r"moderation",    # Moderation
        r"instruct-base", # Small base models
    ]

    @classmethod
    def _is_blacklisted(cls, model_name: str) -> bool:
        """Check if model matches any blacklist pattern."""
        name_lower = model_name.lower()
        return any(re.search(pattern, name_lower) for pattern in cls.BLACKLIST_PATTERNS)

    @classmethod
    def _compute_capability_score(cls, model_name: str) -> int:
        """
        Ranks a model's capability. Higher score = better model.
        Considers: parameter size, version recency, model family.
        """
        name = model_name.lower()
        score = 0

        # Parameter size bonuses (higher = better)
        param_matches = {
            "405b": 500, "70b": 400, "72b": 400, "40b": 300, "34b": 280,
            "32b": 270, "22b": 250, "17b": 200, "13b": 180, "9b": 150,
            "8b": 140, "7b": 130, "3b": 80, "1b": 40,
        }
        for size, bonus in param_matches.items():
            if size in name:
                score += bonus
                break

        # Version recency bonuses
        if "3.3" in name or "3.5" in name:
            score += 100
        elif "3.2" in name:
            score += 90
        elif "3.1" in name:
            score += 80
        elif "llama-3" in name or "llama3" in name:
            score += 70
        elif "2.0" in name or "2.5" in name:
            score += 60

        # Model family bonuses
        if "llama" in name:
            score += 30
        if "mixtral" in name:
            score += 25
        if "gemma" in name:
            score += 20
        if "qwen" in name:
            score += 15

        # Context window bonuses (from name hints)
        if "128k" in name or "131072" in name:
            score += 50
        elif "32k" in name or "32768" in name:
            score += 30
        elif "8192" in name or "8k" in name:
            score += 15

        # Explicit modifier bonuses
        if "versatile" in name:
            score += 20
        if "instant" in name:
            score += 10
        if "pro" in name:
            score += 15
        if "flash" in name:
            score += 12

        # Preview/experimental penalties (unstable)
        if "preview" in name or "experimental" in name or "alpha" in name or "beta" in name:
            score -= 30

        # Deprecated model penalties
        if "deprecated" in name or "legacy" in name:
            score -= 200

        return score

    # ═══════════════════════════════════════════════════════════════
    # GROQ Model Discovery
    # ═══════════════════════════════════════════════════════════════
    @classmethod
    async def get_groq_models(cls, force_refresh: bool = False) -> List[str]:
        """
        Fetches all available Groq models via /openai/v1/models endpoint,
        filters, ranks by capability, and returns sorted list (best first).
        """
        cache_key = "groq"
        now = time.time()

        # Return cached result if fresh
        if not force_refresh and cache_key in _model_cache:
            cached = _model_cache[cache_key]
            if now - cached["timestamp"] < CACHE_TTL_SECONDS:
                return cached["models"]

        api_key = settings.GROQ_API_KEY
        if not api_key or "your" in api_key.lower():
            print("[Discovery] Groq API key missing")
            return []

        url = "https://api.groq.com/openai/v1/models"
        headers = {"Authorization": f"Bearer {api_key}"}

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, headers=headers)
                if response.status_code != 200:
                    print(f"[Discovery] Groq model list failed: {response.status_code}")
                    return []

                data = response.json()
                all_models = data.get("data", [])

                # Filter and score
                scored_models = []
                for model in all_models:
                    model_id = model.get("id", "")
                    if not model_id or cls._is_blacklisted(model_id):
                        continue
                    # Only include chat completion models (active ones)
                    if not model.get("active", True):
                        continue

                    score = cls._compute_capability_score(model_id)
                    scored_models.append((score, model_id))

                # Sort by score descending (best first)
                scored_models.sort(reverse=True, key=lambda x: x[0])
                ranked_ids = [m[1] for m in scored_models]

                # Cache result
                _model_cache[cache_key] = {
                    "timestamp": now,
                    "models": ranked_ids,
                }

                print(f"[Discovery] Groq discovered {len(ranked_ids)} models. Top: {ranked_ids[:3]}")
                return ranked_ids

        except Exception as e:
            print(f"[Discovery] Groq discovery exception: {e}")
            return []

    # ═══════════════════════════════════════════════════════════════
    # GEMINI Model Discovery
    # ═══════════════════════════════════════════════════════════════
    @classmethod
    async def get_gemini_models(cls, force_refresh: bool = False) -> List[str]:
        """
        Fetches Gemini models via /v1beta/models, filters for generateContent support,
        and ranks by capability.
        """
        cache_key = "gemini"
        now = time.time()

        if not force_refresh and cache_key in _model_cache:
            cached = _model_cache[cache_key]
            if now - cached["timestamp"] < CACHE_TTL_SECONDS:
                return cached["models"]

        api_key = settings.GOOGLE_GEMINI_API_KEY
        if not api_key or "your" in api_key.lower():
            print("[Discovery] Gemini API key missing")
            return []

        # Try both v1 and v1beta endpoints
        for version in ["v1beta", "v1"]:
            url = f"https://generativelanguage.googleapis.com/{version}/models?key={api_key}"

            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.get(url)
                    if response.status_code != 200:
                        continue

                    data = response.json()
                    all_models = data.get("models", [])

                    scored_models = []
                    for model in all_models:
                        full_name = model.get("name", "")
                        # Extract model ID from "models/gemini-1.5-flash"
                        model_id = full_name.replace("models/", "")
                        if not model_id or cls._is_blacklisted(model_id):
                            continue

                        # Must support generateContent
                        supported_methods = model.get("supportedGenerationMethods", [])
                        if "generateContent" not in supported_methods:
                            continue

                        score = cls._compute_capability_score(model_id)
                        # Store version metadata with model
                        scored_models.append((score, f"{version}/{model_id}"))

                    scored_models.sort(reverse=True, key=lambda x: x[0])
                    ranked_ids = [m[1] for m in scored_models]

                    if ranked_ids:
                        _model_cache[cache_key] = {
                            "timestamp": now,
                            "models": ranked_ids,
                        }
                        print(f"[Discovery] Gemini discovered {len(ranked_ids)} models. Top: {ranked_ids[:3]}")
                        return ranked_ids

            except Exception as e:
                print(f"[Discovery] Gemini {version} exception: {e}")
                continue

        return []

    # ═══════════════════════════════════════════════════════════════
    # Cache utilities
    # ═══════════════════════════════════════════════════════════════
    @classmethod
    def clear_cache(cls):
        """Manually clears the model discovery cache."""
        _model_cache.clear()
        print("[Discovery] Cache cleared")

    @classmethod
    def get_cache_status(cls) -> Dict:
        """Returns current cache metadata for debugging."""
        return {
            provider: {
                "cached": True,
                "age_seconds": int(time.time() - data["timestamp"]),
                "model_count": len(data["models"]),
                "top_models": data["models"][:3],
            }
            for provider, data in _model_cache.items()
        }