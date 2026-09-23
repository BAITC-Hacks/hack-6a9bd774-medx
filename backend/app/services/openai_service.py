import json
from openai import AsyncOpenAI, OpenAIError
from pydantic import ValidationError
from ..config import settings
from ..schemas import Analysis
from .prompts import ANALYSIS_PROMPT
from .readiness import WEIGHTS


class AnalysisUnavailable(Exception):
    pass


async def analyze(description: str, confirmed: dict | None = None) -> Analysis:
    if not settings.openai_api_key or settings.openai_api_key.startswith("your_"):
        raise AnalysisUnavailable("OpenAI не настроен. Добавьте ключ в backend/.env или используйте ручное заполнение.")
    supplied = {"description": description, "confirmed_facts": confirmed or {}}
    try:
        async with AsyncOpenAI(api_key=settings.openai_api_key, timeout=35, max_retries=1) as client:
            response = await client.responses.parse(
                model=settings.openai_model,
                input=[{"role": "system", "content": ANALYSIS_PROMPT},
                       {"role": "user", "content": json.dumps(supplied, ensure_ascii=False)}],
                text_format=Analysis,
                max_output_tokens=3500,
                store=False,
            )
        result = response.output_parsed
        if result is None:
            raise AnalysisUnavailable("AI не вернул анализ. Попробуйте уточнить описание и повторить.")
        # Reject unsupported facts, even when the model returns valid JSON.
        sources = [description, *[v for v in (confirmed or {}).values() if isinstance(v, str)]]
        for field in WEIGHTS:
            value = getattr(result, field)
            if value and not any(value in source for source in sources):
                setattr(result, field, None)
        return result
    except (OpenAIError, ValidationError, ValueError) as exc:
        raise AnalysisUnavailable("AI-анализ сейчас недоступен. Ваш текст сохранён в форме. Повторите попытку или заполните поля вручную.") from exc
