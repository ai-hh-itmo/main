from contextlib import asynccontextmanager
import logging
from pathlib import Path
from typing import List

import pandas as pd
from catboost import CatBoostClassifier
from fastapi import APIRouter, FastAPI
from pydantic import BaseModel, Field


class MatchCandidate(BaseModel):
    candidate_id: str
    cosine_similarity: float


class RecSysRequest(BaseModel):
    candidates: List[MatchCandidate] = Field(..., description="Кандидаты после этапа Matcher")
    top_n: int = Field(default=20, description="Количество финальных кандидатов для выдачи HR")


class FinalCandidate(BaseModel):
    candidate_id: str
    final_score: float = Field(..., description="Итоговый скор рекомендательной системы")


class RecSysResponse(BaseModel):
    top_candidates: List[FinalCandidate] = Field(..., description="Финальная выдача для фронтенда")


logger = logging.getLogger("rec-sys")
model: CatBoostClassifier | None = None
features_df: pd.DataFrame | None = None

FEATURE_COLUMNS = ["has_contacted", "has_replied", "history_appearances", "exp_years"]


@asynccontextmanager
async def lifespan(_: FastAPI):
    global model, features_df

    model_path = "catboost_model.cbm"
    csv_path = "candidates_features.csv"

    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")
    if not csv_path.exists():
        raise FileNotFoundError(f"Features file not found: {csv_path}")

    loaded_model = CatBoostClassifier()
    loaded_model.load_model(str(model_path))
    model = loaded_model

    loaded_df = pd.read_csv(csv_path).set_index("candidate_id")
    features_df = loaded_df
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
                final_score=final_score,
            )
        )

    ranked.sort(key=lambda item: item.final_score, reverse=True)
    return RecSysResponse(top_candidates=ranked[: payload.top_n])


app.include_router(router)
