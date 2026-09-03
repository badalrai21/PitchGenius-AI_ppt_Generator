"""
Industry-Grade Multi-Provider Image Search Service
Priority chain: Unsplash → Pexels → HuggingFace FLUX → Picsum fallback
Fully compliant with Unsplash API Guidelines v2026:
  - Hotlinks to original photo.urls CDN
  - Triggers download_location endpoint on use
  - Returns photographer attribution data for frontend display
"""
import httpx
import time
import base64
from typing import Optional, Dict, List
from app.core.config import get_settings

settings = get_settings()

_image_cache: Dict[str, Dict] = {}
CACHE_TTL_SECONDS = 3600


class ImageSearchService:

    @classmethod
    async def _trigger_unsplash_download(cls, download_url: str):
        """
        REQUIRED by Unsplash guidelines: trigger download event
        so the photographer gets credited when a user uses their photo.
        """
        api_key = settings.UNSPLASH_ACCESS_KEY
        if not api_key or not download_url:
            return
        try:
            headers = {"Authorization": f"Client-ID {api_key}"}
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.get(download_url, headers=headers)
        except Exception:
            pass

    @classmethod
    async def search_unsplash(cls, query: str) -> Optional[Dict]:
        """
        Search Unsplash API.
        Returns dict with: url, photographer_name, photographer_profile
        All required for production attribution compliance.
        """
        api_key = settings.UNSPLASH_ACCESS_KEY
        if not api_key or "your" in api_key.lower():
            return None

        try:
            url = "https://api.unsplash.com/search/photos"
            headers = {"Authorization": f"Client-ID {api_key}"}
            params = {
                "query": query,
                "per_page": 5,
                "orientation": "landscape",
                "content_filter": "high",
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, headers=headers, params=params)
                if res.status_code != 200:
                    print(f"[ImageSearch] Unsplash {res.status_code}: {res.text[:100]}")
                    return None

                data = res.json()
                results = data.get("results", [])
                if not results:
                    return None

                best = results[0]

                # ★ HOTLINK to original Unsplash CDN URL (guideline requirement)
                image_url = best.get("urls", {}).get("regular")

                # ★ TRIGGER DOWNLOAD (guideline requirement)
                download_url = best.get("links", {}).get("download_location")
                if download_url:
                    await cls._trigger_unsplash_download(download_url)

                # ★ PHOTOGRAPHER ATTRIBUTION DATA (guideline requirement)
                user = best.get("user", {})
                photographer_name = user.get("name", "Unsplash Photographer")
                photographer_username = user.get("username", "")
                photographer_profile = (
                    f"https://unsplash.com/@{photographer_username}"
                    f"?utm_source=pitchgenius&utm_medium=referral"
                    if photographer_username
                    else f"https://unsplash.com?utm_source=pitchgenius&utm_medium=referral"
                )

                print(f"[ImageSearch] Unsplash: '{query}' → photo by {photographer_name}")

                return {
                    "url": image_url,
                    "photographer_name": photographer_name,
                    "photographer_profile": photographer_profile,
                    "source": "unsplash",
                }

        except Exception as e:
            print(f"[ImageSearch] Unsplash exception: {e}")
            return None

    @classmethod
    async def search_pexels(cls, query: str) -> Optional[Dict]:
        """Search Pexels API."""
        api_key = settings.PEXELS_API_KEY
        if not api_key or "your" in api_key.lower():
            return None

        try:
            url = "https://api.pexels.com/v1/search"
            headers = {"Authorization": api_key}
            params = {"query": query, "per_page": 5, "orientation": "landscape"}

            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, headers=headers, params=params)
                if res.status_code != 200:
                    return None

                data = res.json()
                photos = data.get("photos", [])
                if not photos:
                    return None

                best = photos[0]
                photographer = best.get("photographer", "Pexels Photographer")
                photographer_url = best.get("photographer_url", "https://www.pexels.com")

                return {
                    "url": best.get("src", {}).get("large"),
                    "photographer_name": photographer,
                    "photographer_profile": photographer_url,
                    "source": "pexels",
                }

        except Exception as e:
            print(f"[ImageSearch] Pexels exception: {e}")
            return None

    @classmethod
    async def generate_flux(cls, query: str) -> Optional[Dict]:
        """Generate image via HuggingFace FLUX.1."""
        hf_token = settings.HUGGINGFACE_TOKEN
        if not hf_token or "your" in hf_token.lower():
            return None

        try:
            url = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
            headers = {"Authorization": f"Bearer {hf_token}"}
            payload = {"inputs": f"{query}, professional photography, cinematic lighting, 8k"}

            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code != 200:
                    return None

                b64 = base64.b64encode(res.content).decode()
                return {
                    "url": f"data:image/jpeg;base64,{b64}",
                    "photographer_name": "AI Generated",
                    "photographer_profile": "",
                    "source": "ai",
                }

        except Exception as e:
            print(f"[ImageSearch] FLUX exception: {e}")
            return None

    @classmethod
    async def get_image(cls, query: str, use_ai_generation: bool = False) -> Dict:
        """
        Main entry point. Returns dict with url + attribution data.
        Priority: Unsplash → Pexels → FLUX → Picsum
        """
        if not query or not query.strip():
            query = "abstract technology"

        cache_key = query.lower().strip()
        now = time.time()

        if cache_key in _image_cache:
            cached = _image_cache[cache_key]
            if now - cached["timestamp"] < CACHE_TTL_SECONDS:
                return cached["data"]

        result = None

        # Priority 1: Unsplash
        result = await cls.search_unsplash(query)

        # Priority 2: Pexels
        if not result:
            result = await cls.search_pexels(query)

        # Priority 3: AI generation
        if not result and use_ai_generation:
            result = await cls.generate_flux(query)

        # Final fallback: Picsum
        if not result:
            seed = cache_key.replace(" ", "-")[:50]
            result = {
                "url": f"https://picsum.photos/seed/{seed}/1200/675",
                "photographer_name": "",
                "photographer_profile": "",
                "source": "picsum",
            }

        _image_cache[cache_key] = {"data": result, "timestamp": now}
        return result

    @classmethod
    async def batch_get_images(cls, queries: List[str]) -> List[Dict]:
        """Fetch multiple images concurrently."""
        import asyncio
        tasks = [cls.get_image(q) for q in queries]
        return await asyncio.gather(*tasks)