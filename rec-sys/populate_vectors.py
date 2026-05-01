import json
import re
import time
from pathlib import Path
from typing import Any

import requests
from requests import HTTPError, RequestException
from tqdm import tqdm


RESUMES_PATH = Path("mock_resumes.json")
EMBEDDER_URL = "http://localhost:8002/embed"
MATCHER_URL = "http://localhost:8003/add_candidate"

REQUEST_TIMEOUT_SECONDS = 10
RETRY_DELAY_SECONDS = 2
MAX_RETRIES = 3


def post_json_with_retry(url: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.post(url, json=payload, timeout=REQUEST_TIMEOUT_SECONDS)
            response.raise_for_status()
            return response.json()
        except HTTPError as exc:
            status_code = exc.response.status_code if exc.response is not None else "unknown"
            response_text = ""
            if exc.response is not None:
                response_text = exc.response.text

            print(
                f"[WARN] Request to {url} failed with status {status_code} "
                f"(attempt {attempt}/{MAX_RETRIES}). Response: {response_text}"
            )

            # 4xx errors are usually payload/data issues and rarely fixed by retry.
            if exc.response is not None and 400 <= exc.response.status_code < 500:
                return None

            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)
        except RequestException as exc:
            print(f"[WARN] Request to {url} failed (attempt {attempt}/{MAX_RETRIES}): {exc}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)

    return None


def fit_vector_dimension(vector: list[float], expected_dim: int) -> list[float]:
    if len(vector) == expected_dim:
        return vector
    if len(vector) > expected_dim:
        return vector[:expected_dim]
    return vector + [0.0] * (expected_dim - len(vector))


def add_candidate_with_dimension_fallback(candidate_id: str, vector: list[float]) -> bool:
    payload = {"candidate_id": candidate_id, "vector": vector}

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.post(MATCHER_URL, json=payload, timeout=REQUEST_TIMEOUT_SECONDS)
            response.raise_for_status()
            return True
        except HTTPError as exc:
            if exc.response is None:
                print(f"[WARN] Matcher request failed without response: {exc}")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY_SECONDS)
                continue

            status_code = exc.response.status_code
            response_text = exc.response.text
            print(
                f"[WARN] Request to {MATCHER_URL} failed with status {status_code} "
                f"(attempt {attempt}/{MAX_RETRIES}). Response: {response_text}"
            )

            # Handle matcher dimension mismatch once by auto-fitting vector size.
            if status_code == 400:
                match = re.search(r"Expected\\s+(\\d+),\\s+got\\s+(\\d+)", response_text)
                if match:
                    expected_dim = int(match.group(1))
                    got_dim = int(match.group(2))
                    if len(payload["vector"]) == got_dim:
                        payload["vector"] = fit_vector_dimension(payload["vector"], expected_dim)
                        print(
                            f"[WARN] Auto-adjusted vector for {candidate_id}: "
                            f"{got_dim} -> {expected_dim}. Retrying..."
                        )
                        continue
                return False

            if status_code < 500:
                return False

            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)
        except RequestException as exc:
            print(f"[WARN] Request to {MATCHER_URL} failed (attempt {attempt}/{MAX_RETRIES}): {exc}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)

    return False


def main() -> None:
    if not RESUMES_PATH.exists():
        raise FileNotFoundError(f"File not found: {RESUMES_PATH}")

    with RESUMES_PATH.open("r", encoding="utf-8") as file:
        resumes = json.load(file)

    if not isinstance(resumes, dict):
        raise ValueError("mock_resumes.json must contain a JSON object: {candidate_id: resume_text}")

    success_count = 0
    failed_candidates: list[str] = []

    for candidate_id, resume_text in tqdm(resumes.items(), desc="Uploading vectors", total=len(resumes)):
        if not isinstance(candidate_id, str) or not isinstance(resume_text, str):
            print(f"[WARN] Skipping malformed record: {candidate_id!r}")
            failed_candidates.append(str(candidate_id))
            continue

        embed_result = post_json_with_retry(EMBEDDER_URL, {"text": resume_text})
        if embed_result is None:
            failed_candidates.append(candidate_id)
            continue

        vector = embed_result.get("vector")
        if not isinstance(vector, list) or not vector:
            print(f"[WARN] Empty or invalid vector for {candidate_id}")
            failed_candidates.append(candidate_id)
            continue

        add_ok = add_candidate_with_dimension_fallback(candidate_id, vector)
        if not add_ok:
            failed_candidates.append(candidate_id)
            continue

        success_count += 1

    print(f"\nFinished. Successfully uploaded: {success_count}/{len(resumes)}")
    if failed_candidates:
        print(f"Failed candidates ({len(failed_candidates)}): {', '.join(failed_candidates)}")
        print(
            "Hint: if matcher returns 'Vector dimension mismatch', "
            "restart matcher with a clean embeddings storage (remove old embeddings.pkl)."
        )


if __name__ == "__main__":
    main()
