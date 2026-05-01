from contextlib import asynccontextmanager
from typing import List

from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer


class EmbedderRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Summarized text to embed")


class EmbedderResponse(BaseModel):
    embedding: List[float]
    vector: List[float]


model: SentenceTransformer | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global model
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    yield


app = FastAPI(title="Embedder Service", version="1.0.0", lifespan=lifespan)
router = APIRouter(prefix="/api/v1/embedder")


@router.post("/embed", response_model=EmbedderResponse)
async def embed_text(request: EmbedderRequest) -> EmbedderResponse:
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded yet")

    embedding = model.encode([request.text])[0].tolist()
    return EmbedderResponse(embedding=embedding, vector=embedding)


app.include_router(router)
