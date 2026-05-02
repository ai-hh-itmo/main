from contextlib import asynccontextmanager
import logging
from pathlib import Path
from typing import List

import json

import pandas as pd
from catboost import CatBoostClassifier
from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel, Field


class MatchCandidate(BaseModel):
    candidate_id: str
    cosine_similarity: float


class RecSysRequest(BaseModel):
    candidates: List[MatchCandidate] = Field(..., description="Кандидаты после этапа Matcher")
    top_n: int = Field(default=20, description="Количество финальных кандидатов для выдачи HR")


class FinalCandidate(BaseModel):
    candidate_id: str
    display_name: str
    final_score: float = Field(..., description="Итоговый скор рекомендательной системы")


class RecSysResponse(BaseModel):
    top_candidates: List[FinalCandidate] = Field(..., description="Финальная выдача для фронтенда")


class CandidateDetails(BaseModel):
    candidate_id: str
    display_name: str
    resume: str | None = None
    has_contacted: bool | None = None
    has_replied: bool | None = None
    history_appearances: int | None = None
    exp_years: int | None = None
    salary_expectation: float | None = None


logger = logging.getLogger("rec-sys")
model: CatBoostClassifier | None = None
features_df: pd.DataFrame | None = None
resumes: dict[str, str] = {}

FEATURE_COLUMNS = ["has_contacted", "has_replied", "history_appearances", "exp_years"]
FIRST_NAMES = [
    "Александр",
    "Дмитрий",
    "Михаил",
    "Андрей",
    "Илья",
    "Никита",
    "Егор",
    "Артем",
    "София",
    "Анна",
    "Мария",
    "Екатерина",
    "Дарья",
    "Полина",
    "Виктория",
    "Алина",
]
LAST_NAMES = [
    "Иванов",
    "Смирнов",
    "Кузнецов",
    "Попов",
    "Соколов",
    "Лебедев",
    "Козлов",
    "Новиков",
    "Морозова",
    "Волкова",
    "Павлова",
    "Семенова",
    "Голубева",
    "Виноградова",
    "Богданова",
    "Федорова",
]
MIDDLE_NAMES = [
    "Алексеевич",
    "Дмитриевич",
    "Михайлович",
    "Андреевич",
    "Ильич",
    "Никитич",
    "Егорович",
    "Артемович",
    "Алексеевна",
    "Дмитриевна",
    "Михайловна",
    "Андреевна",
    "Ильинична",
    "Никитична",
    "Егоровна",
    "Артемовна",
]


def candidate_display_name(candidate_id: str) -> str:
    number = int("".join(char for char in candidate_id if char.isdigit()) or "0")
    first_index = number % len(FIRST_NAMES)
    gender_offset = 8 if first_index >= 8 else 0
    first = FIRST_NAMES[first_index]
    last = LAST_NAMES[gender_offset + ((number // len(FIRST_NAMES)) % 8)]
    middle = MIDDLE_NAMES[gender_offset + ((number // (len(FIRST_NAMES) * 8)) % 8)]
    return f"{last} {first} {middle}"


@asynccontextmanager
async def lifespan(_: FastAPI):
    global model, features_df, resumes

    model_path = Path("catboost_model.cbm")
    csv_path = Path("candidates_features.csv")
    resumes_path = Path("mock_resumes.json")

    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")
    if not csv_path.exists():
        raise FileNotFoundError(f"Features file not found: {csv_path}")

    loaded_model = CatBoostClassifier()
    loaded_model.load_model(str(model_path))
    model = loaded_model

    loaded_df = pd.read_csv(csv_path).set_index("candidate_id")
    features_df = loaded_df
    if resumes_path.exists():
        with resumes_path.open("r", encoding="utf-8") as file:
            loaded_resumes = json.load(file)
        if isinstance(loaded_resumes, dict):
            resumes = {str(key): str(value) for key, value in loaded_resumes.items()}
    yield


app = FastAPI(title="Rec-Sys Service", version="1.0.0", lifespan=lifespan)
router = APIRouter(prefix="/api/v1/rec-sys")


@router.post("/rank", response_model=RecSysResponse)
def rank_candidates(payload: RecSysRequest) -> RecSysResponse:
    if model is None or features_df is None:
        return RecSysResponse(top_candidates=[])

    ranked: list[FinalCandidate] = []

    for candidate in payload.candidates:
        if candidate.candidate_id not in features_df.index:
            logger.warning("candidate_id '%s' not found in candidates_features.csv", candidate.candidate_id)
            continue

        row = features_df.loc[candidate.candidate_id, FEATURE_COLUMNS]
        row_df = pd.DataFrame([row.values], columns=FEATURE_COLUMNS)
        catboost_proba = float(model.predict_proba(row_df)[0][1])

        final_score = (candidate.cosine_similarity + catboost_proba) / 2
        ranked.append(
            FinalCandidate(
                candidate_id=candidate.candidate_id,
                display_name=candidate_display_name(candidate.candidate_id),
                final_score=final_score,
            )
        )

    ranked.sort(key=lambda item: item.final_score, reverse=True)
    return RecSysResponse(top_candidates=ranked[: payload.top_n])


@router.get("/candidates/{candidate_id}", response_model=CandidateDetails)
def get_candidate(candidate_id: str) -> CandidateDetails:
    if features_df is None:
        raise HTTPException(status_code=503, detail="Candidate features are not loaded")

    if candidate_id not in features_df.index and candidate_id not in resumes:
        raise HTTPException(status_code=404, detail="Candidate not found")

    row = features_df.loc[candidate_id] if candidate_id in features_df.index else None
    return CandidateDetails(
        candidate_id=candidate_id,
        display_name=candidate_display_name(candidate_id),
        resume=resumes.get(candidate_id),
        has_contacted=bool(row["has_contacted"]) if row is not None else None,
        has_replied=bool(row["has_replied"]) if row is not None else None,
        history_appearances=int(row["history_appearances"]) if row is not None else None,
        exp_years=int(row["exp_years"]) if row is not None else None,
        salary_expectation=float(row["salary_expectation"]) if row is not None else None,
    )


app.include_router(router)
