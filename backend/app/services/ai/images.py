import logging
import httpx
import base64
import io
from typing import Optional
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def generate_ai_image(prompt: str, width: int = 1024, height: int = 576) -> Optional[bytes]:
    """
    Generate an image using HuggingFace FLUX.1-schnell (free, fast).
    Returns raw PNG bytes or None if generation fails.
    """
    if not settings.HUGGINGFACE_TOKEN:
        logger.info("No HuggingFace token configured. Skipping AI image generation.")
        return None

    url = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
    headers = {"Authorization": f"Bearer {settings.HUGGINGFACE_TOKEN}"}
    payload = {
        "inputs": prompt,
        "parameters": {
            "width": width,
            "height": height,
            "num_inference_steps": 4,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(url, headers=headers, json=payload)
            if res.status_code == 200 and res.headers.get("content-type", "").startswith("image"):
                return res.content
            else:
                logger.warning(f"FLUX image generation returned {res.status_code}")
                return None
    except Exception as e:
        logger.error(f"AI image generation failed: {e}")
        return None


async def fetch_stock_image(query: str) -> Optional[bytes]:
    """
    Fetch a high-quality stock photo from Unsplash (free tier: 50 req/hr).
    Falls back to Pexels if Unsplash fails.
    Returns raw JPEG bytes or None.
    """
    # Try Unsplash first
    if settings.UNSPLASH_ACCESS_KEY:
        try:
            url = "https://api.unsplash.com/photos/random"
            params = {"query": query, "orientation": "landscape", "count": 1}
            headers = {"Authorization": f"Client-ID {settings.UNSPLASH_ACCESS_KEY}"}

            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(url, headers=headers, params=params)
                if res.status_code == 200:
                    data = res.json()
                    if isinstance(data, list) and len(data) > 0:
                        img_url = data[0]["urls"]["regular"]
                    else:
                        img_url = data["urls"]["regular"]

                    img_res = await client.get(img_url)
                    if img_res.status_code == 200:
                        return img_res.content
        except Exception as e:
            logger.warning(f"Unsplash fetch failed: {e}")

    # Fallback to Pexels
    if settings.PEXELS_API_KEY:
        try:
            url = "https://api.pexels.com/v1/search"
            params = {"query": query, "per_page": 1, "orientation": "landscape"}
            headers = {"Authorization": settings.PEXELS_API_KEY}

            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(url, headers=headers, params=params)
                if res.status_code == 200:
                    data = res.json()
                    photos = data.get("photos", [])
                    if photos:
                        img_url = photos[0]["src"]["large"]
                        img_res = await client.get(img_url)
                        if img_res.status_code == 200:
                            return img_res.content
        except Exception as e:
            logger.warning(f"Pexels fetch failed: {e}")

    return None


async def get_slide_image(image_prompt: str, use_ai: bool = True) -> Optional[bytes]:
    """
    Smart image resolver: tries AI generation first, falls back to stock photos.
    """
    if use_ai:
        ai_image = await generate_ai_image(image_prompt)
        if ai_image:
            return ai_image

    stock_image = await fetch_stock_image(image_prompt)
    if stock_image:
        return stock_image

    return None