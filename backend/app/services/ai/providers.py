import json
import logging
import re
import httpx
from typing import Dict, Any
from app.core.config import get_settings
from app.services.ai.discovery import ModelDiscoveryService

logger = logging.getLogger(__name__)

def extract_json(raw_text: str) -> Dict[str, Any]:
    """Robust JSON extractor that extracts valid JSON even with surrounding text."""
    text = raw_text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse valid JSON from AI response: {text[:200]}...")


class MultiAIProvider:
    """
    Auto-discovering Multi-AI Orchestrator:
    - Auto-detects latest models from your API keys
    - Zero hardcoded model names
    - Automatic fallback across Groq, Gemini, and Hugging Face
    """

    @classmethod
    async def generate_json(cls, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        settings = get_settings()
        errors = []

        # ----------------------------------------------------
        # 1. PRIMARY: GROQ (Auto-Discovered & Ranked Models)
        # ----------------------------------------------------
        if settings.GROQ_API_KEY:
            groq_models = await ModelDiscoveryService.get_groq_models(settings.GROQ_API_KEY)
            for model_name in groq_models:
                try:
                    logger.info(f"Auto-selected Groq Model: {model_name}")
                    return await cls._call_groq(system_prompt, user_prompt, settings.GROQ_API_KEY, model_name)
                except Exception as e:
                    logger.warning(f"Groq [{model_name}] error: {str(e)}")
                    errors.append(f"Groq [{model_name}]: {str(e)}")
                    continue

        # ----------------------------------------------------
        # 2. SECONDARY: GOOGLE GEMINI (Auto-Discovered Models)
        # ----------------------------------------------------
        if settings.GOOGLE_GEMINI_API_KEY:
            gemini_models = await ModelDiscoveryService.get_gemini_models(settings.GOOGLE_GEMINI_API_KEY)
            for model_name in gemini_models:
                try:
                    logger.info(f"Auto-selected Gemini Model: {model_name}")
                    return await cls._call_gemini(system_prompt, user_prompt, settings.GOOGLE_GEMINI_API_KEY, model_name)
                except Exception as e:
                    logger.warning(f"Gemini [{model_name}] error: {str(e)}")
                    errors.append(f"Gemini [{model_name}]: {str(e)}")
                    continue

        # ----------------------------------------------------
        # 3. TERTIARY: HUGGING FACE
        # ----------------------------------------------------
        if settings.HUGGINGFACE_TOKEN:
            try:
                logger.info("Auto-selected Hugging Face Provider")
                return await cls._call_huggingface(system_prompt, user_prompt, settings.HUGGINGFACE_TOKEN)
            except Exception as e:
                errors.append(f"HuggingFace: {str(e)}")

        raise RuntimeError(f"All AI Providers failed. Details:\n" + "\n".join(errors))

    @classmethod
    async def _call_groq(cls, system_prompt: str, user_prompt: str, api_key: str, model: str) -> Dict[str, Any]:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        
        enhanced_system = system_prompt + "\n\nCRITICAL: Respond ONLY with valid, raw JSON. Do not include markdown code fences or conversational text."
        
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": enhanced_system},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.6,
            "max_tokens": 4096,
        }

        try:
            payload["response_format"] = {"type": "json_object"}
            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(url, headers=headers, json=payload)
        except Exception:
            payload.pop("response_format", None)
            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(url, headers=headers, json=payload)

        if res.status_code != 200:
            if res.status_code == 400 and "response_format" in payload:
                payload.pop("response_format", None)
                async with httpx.AsyncClient(timeout=45.0) as client:
                    res = await client.post(url, headers=headers, json=payload)
            
            if res.status_code != 200:
                raise ValueError(f"Status {res.status_code}: {res.text}")

        data = res.json()
        content = data["choices"][0]["message"]["content"]
        return extract_json(content)

    @classmethod
    async def _call_gemini(cls, system_prompt: str, user_prompt: str, api_key: str, model: str) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"SYSTEM INSTRUCTION:\n{system_prompt}\n\nUSER REQUEST:\n{user_prompt}\n\nRespond with valid JSON only."}
                    ]
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.7,
            },
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            res = await client.post(url, json=payload)
            if res.status_code != 200:
                raise ValueError(f"Status {res.status_code}: {res.text}")
            data = res.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            return extract_json(raw_text)

    @classmethod
    async def _call_huggingface(cls, system_prompt: str, user_prompt: str, token: str) -> Dict[str, Any]:
        url = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-70B-Instruct"
        headers = {"Authorization": f"Bearer {token}"}
        prompt = f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n{system_prompt}\nRespond with JSON only.<|eot_id|><|start_header_id|>user<|end_header_id|>\n{user_prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n"
        
        payload = {
            "inputs": prompt,
            "parameters": {"max_new_tokens": 3000, "temperature": 0.7, "return_full_text": False},
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(url, headers=headers, json=payload)
            if res.status_code != 200:
                raise ValueError(f"Status {res.status_code}: {res.text}")
            result = res.json()
            text = result[0]["generated_text"]
            return extract_json(text)