import json
import random
import urllib.error
import urllib.request


BASE_URL = "http://127.0.0.1:8000"
VECTOR_SIZE = 348


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


def random_vector(size: int) -> list[float]:
    return [random.random() for _ in range(size)]


def main() -> None:
    print("Adding 3 random candidates...")
    for idx in range(3):
        payload = {
            "candidate_id": f"candidate_{idx + 1}",
            "vector": random_vector(VECTOR_SIZE),
        }
        result = post_json("/add_candidate", payload)
        print("add_candidate:", result)

    vacancy_vector = random_vector(VECTOR_SIZE)
    print("\nRunning /match...")
    match_result = post_json("/match", {"vacancy_vector": vacancy_vector})
    print(json.dumps(match_result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except urllib.error.URLError as exc:
        print("Cannot connect to matcher service. Start FastAPI first:")
        print("uvicorn main:app --host 0.0.0.0 --port 8000")
        print(f"Error: {exc}")
