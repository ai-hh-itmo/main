from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, List

import hashlib
import numpy as np
import pickle
from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel, Field


EMBEDDINGS_PATH = Path("embeddings.pkl")
DEFAULT_VECTOR_SIZE = 384
DEFAULT_CANDIDATE_COUNT = 100
candidate_embeddings: Dict[str, np.ndarray] = {}


class MatchRequest(BaseModel):
    vacancy_embedding: List[float] | None = Field(default=None, min_length=1)
    vacancy_vector: List[float] | None = Field(default=None, min_length=1)
    top_k: int = Field(default=1000, ge=1)


class MatchResult(BaseModel):
    candidate_id: str
    cosine_similarity: float


class MatchResponse(BaseModel):
    candidates: List[MatchResult]
    matches: List[MatchResult]


class AddCandidateRequest(BaseModel):
    candidate_id: str = Field(..., min_length=1)
    vector: List[float] = Field(..., min_length=1)


def save_embeddings() -> None:
    serialized = {k: v.tolist() for k, v in candidate_embeddings.items()}
    with EMBEDDINGS_PATH.open("wb") as file:
        pickle.dump(serialized, file)


def load_embeddings() -> Dict[str, np.ndarray]:
    if not EMBEDDINGS_PATH.exists():
        return {}

    with EMBEDDINGS_PATH.open("rb") as file:
        raw_data = pickle.load(file)

    if not isinstance(raw_data, dict):
        raise ValueError("Invalid embeddings file format: expected dictionary.")

    loaded: Dict[str, np.ndarray] = {}
    for candidate_id, vector in raw_data.items():
        arr = np.asarray(vector, dtype=np.float64)
        if arr.ndim != 1 or arr.size == 0:
            raise ValueError(f"Invalid vector for candidate '{candidate_id}'.")
        loaded[str(candidate_id)] = arr

    return loaded


def build_default_embeddings() -> Dict[str, np.ndarray]:
    embeddings: Dict[str, np.ndarray] = {}
    for idx in range(1, DEFAULT_CANDIDATE_COUNT + 1):
        candidate_id = f"cand_{idx:03d}"
        seed = int.from_bytes(
            hashlib.sha256(candidate_id.encode("utf-8")).digest()[:8],
            "big",
        )
        rng = np.random.default_rng(seed)
        embeddings[candidate_id] = rng.normal(size=DEFAULT_VECTOR_SIZE)
    return embeddings


@asynccontextmanager
async def lifespan(_: FastAPI):
    global candidate_embeddings
    candidate_embeddings = load_embeddings()
    if not candidate_embeddings:
        candidate_embeddings = build_default_embeddings()
    yield


app = FastAPI(title="Matcher Service", lifespan=lifespan)
router = APIRouter(prefix="/api/v1/matcher")


@router.post("/add_candidate")
def add_candidate(payload: AddCandidateRequest):
    vector = np.asarray(payload.vector, dtype=np.float64)

    if vector.ndim != 1 or vector.size == 0:
        raise HTTPException(status_code=400, detail="Vector must be 1D and non-empty.")

    if candidate_embeddings:
        existing_dim = next(iter(candidate_embeddings.values())).shape[0]
        if vector.shape[0] != existing_dim:
            raise HTTPException(
                status_code=400,
                detail=f"Vector dimension mismatch. Expected {existing_dim}, got {vector.shape[0]}.",
            )

    candidate_embeddings[payload.candidate_id] = vector
    save_embeddings()
    return {"status": "ok", "candidate_id": payload.candidate_id}


@router.post("/match", response_model=MatchResponse)
def match(payload: MatchRequest):
    if not candidate_embeddings:
        return MatchResponse(candidates=[], matches=[])

    vector = payload.vacancy_embedding or payload.vacancy_vector
    if vector is None:
        raise HTTPException(status_code=400, detail="vacancy_embedding is required.")

    vacancy_vector = np.asarray(vector, dtype=np.float64)
    if vacancy_vector.ndim != 1 or vacancy_vector.size == 0:
        raise HTTPException(status_code=400, detail="vacancy_vector must be 1D and non-empty.")

    candidate_ids = list(candidate_embeddings.keys())
    candidate_matrix = np.vstack([candidate_embeddings[cid] for cid in candidate_ids])

    if candidate_matrix.shape[1] != vacancy_vector.shape[0]:
        raise HTTPException(
            status_code=400,
            detail=(
                "vacancy_vector dimension mismatch. "
                f"Expected {candidate_matrix.shape[1]}, got {vacancy_vector.shape[0]}."
            ),
        )

    candidate_norms = np.linalg.norm(candidate_matrix, axis=1)
    vacancy_norm = np.linalg.norm(vacancy_vector)
    denominator = candidate_norms * vacancy_norm
    dot_products = candidate_matrix @ vacancy_vector

    similarities = np.zeros_like(dot_products, dtype=np.float64)
    valid_mask = denominator > 0
    similarities[valid_mask] = dot_products[valid_mask] / denominator[valid_mask]

    sorted_indices = np.argsort(-similarities)
    top_indices = sorted_indices[: payload.top_k]

    results = [
        MatchResult(
            candidate_id=candidate_ids[i],
            cosine_similarity=float(similarities[i]),
        )
        for i in top_indices
    ]
    return MatchResponse(candidates=results, matches=results)


app.include_router(router)
