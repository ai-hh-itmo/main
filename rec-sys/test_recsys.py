import json
import random
import urllib.error
import urllib.request


BASE_URL = "http://127.0.0.1:8004"


def post_json(path: str, payload: dict) -> dict:
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url=f"{BASE_URL}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        body = response.read().decode("utf-8")
        return json.loads(body)


def build_candidates(n: int = 25) -> list[dict]:
    candidates = []
    for i in range(1, n + 1):
        candidates.append(
            {
                "candidate_id": f"cand_{i:03d}",
                "cosine_similarity": round(random.uniform(0.35, 0.99), 4),
            }
        )

    # Unknown id to validate skip behavior in rec-sys.
    candidates.append({"candidate_id": "cand_999", "cosine_similarity": 0.95})
    return candidates


def validate_response(response: dict, top_n: int) -> None:
    if "top_candidates" not in response or not isinstance(response["top_candidates"], list):
        raise ValueError("Invalid response format: expected list in 'top_candidates'")

    top_candidates = response["top_candidates"]
    if len(top_candidates) > top_n:
        raise ValueError(f"Expected at most {top_n} items, got {len(top_candidates)}")

    prev = float("inf")
    for item in top_candidates:
        if "candidate_id" not in item or "final_score" not in item:
            raise ValueError("Each item must contain candidate_id and final_score")
        if item["final_score"] > prev:
            raise ValueError("top_candidates are not sorted by final_score desc")
        prev = item["final_score"]


def main() -> None:
    random.seed(42)
    payload = {
        "candidates": build_candidates(25),
        "top_n": 10,
    }
    print("Calling /rank with 26 candidates (including unknown candidate_id)...")
    response = post_json("/api/v1/rec-sys/rank", payload)
    validate_response(response, payload["top_n"])

    print("Response is valid.")
    print(json.dumps(response, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except urllib.error.URLError as exc:
        print("Cannot connect to rec-sys service. Start FastAPI first:")
        print("uvicorn main:app --host 0.0.0.0 --port 8004")
        print(f"Error: {exc}")
    except ValueError as exc:
        print(f"Validation failed: {exc}")
