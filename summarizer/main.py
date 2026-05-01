import os

import openai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field


SYSTEM_PROMPT = (
    "Ты HR-ассистент. Твоя задача — извлечь из текста вакансии ключевую информацию: "
    "должность, требуемые хард-скиллы, опыт работы и ключевые обязанности. "
    "Убери всю «воду», рекламные описания компании и оставь только сухую выжимку "
    "в виде связного текста."
)


class SummarizerRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={"example": {"vacancy_text": "Senior Python developer..."}}
    )

    vacancy_text: str = Field(..., description="Raw vacancy text from HR")


class SummarizerResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={"example": {"summary": "Senior Python, backend, 5+ years"}}
    )

    summary: str = Field(..., description="Summarized vacancy text")


app = FastAPI(title="Summarizer Service", version="1.0.0")


@app.post("/summarize", response_model=SummarizerResponse)
def summarize(payload: SummarizerRequest) -> SummarizerResponse:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is not configured",
        )

    base_url = os.getenv("OPENAI_BASE_URL", "https://api.vsellm.ru/v1")
    model = os.getenv("OPENAI_MODEL", "deepseek/deepseek-v3.2")

    try:
        client = openai.OpenAI(api_key=api_key, base_url=base_url)
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": payload.vacancy_text},
            ],
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"LLM request failed: {exc}") from exc

    summary = (response.choices[0].message.content or "").strip()
    if not summary:
        raise HTTPException(status_code=502, detail="LLM returned an empty summary")

    return SummarizerResponse(summary=summary)

