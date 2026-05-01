import requests


def main() -> None:
    url = "http://127.0.0.1:8000/api/v1/embedder/embed"
    payload = {"text": "FastAPI is a modern web framework for building APIs with Python."}

    response = requests.post(url, json=payload, timeout=60)
    response.raise_for_status()

    data = response.json()
    vector = data["vector"]
    print(f"Embedding dimension: {len(vector)}")


if __name__ == "__main__":
    main()
