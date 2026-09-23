import json
import httpx
from pydantic import ValidationError
from ..config import settings
from ..schemas import ReviewResult, TechnicalReview
from .prompts import REVIEW_PROMPT


def unavailable():
    return ReviewResult(status="unavailable", message="Technical review unavailable")


async def review_challenge(facts: dict, suggestions: dict) -> ReviewResult:
    if not settings.nvidia_api_key or settings.nvidia_api_key.startswith("your_"):
        return unavailable()
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            response = await client.post("https://integrate.api.nvidia.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.nvidia_api_key}"},
                json={"model": settings.nvidia_model, "stream": False, "temperature": 0.2, "max_tokens": 1800,
                    "messages": [{"role": "system", "content": REVIEW_PROMPT},
                        {"role": "user", "content": json.dumps({"business_facts": facts, "ai_suggestions": suggestions}, ensure_ascii=False)}]})
            response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        if isinstance(content, str) and content.strip().startswith("```"):
            content = content.strip().split("\n", 1)[1].rsplit("```", 1)[0].strip()
        result = TechnicalReview.model_validate_json(content)
        return ReviewResult(status="available", message="Технический отзыв готов", result=result)
    except (httpx.HTTPError, ValidationError, ValueError, KeyError, IndexError, TypeError):
        return unavailable()
