# Talentmine Backend Orchestrator

Single Go backend that orchestrates external ML services:

1. `summarizer`
2. `embedder`
3. `matcher`
4. `rec-sys`

This service does not communicate directly with DB/VDB.
HTTP layer is built with Gin and supports graceful shutdown on `SIGINT`/`SIGTERM`.

## Requirements

- Go 1.26.2

## Run

```bash
go run ./cmd/server
```

## Environment Variables

- `PORT`
- `REQUEST_TIMEOUT`
- `RETRY_COUNT`
- `RETRY_DELAY`
- `SUMMARIZER_URL`
- `EMBEDDER_URL`
- `MATCHER_URL`
- `RECSYS_URL`

## API

- `GET /health`
- `GET /metrics`
- `POST /api/v1/recommendations`

Request body:

```json
{
  "vacancy_text": "Senior Go backend engineer",
  "top_n": 20,
  "top_k": 1000
}
```

Response body:

```json
{
  "top_candidates": [
    {
      "candidate_id": "usr_1",
      "final_score": 0.94
    }
  ]
}
```
