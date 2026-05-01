import requests


URL = "http://127.0.0.1:8000/api/v1/summarizer/summarize"

TEST_VACANCY = """
Мы — быстрорастущая IT-компания, лидер рынка и команда мечты.
Ищем Senior Python Developer в backend-команду.
Требования: Python, FastAPI, SQL, Docker, Git, опыт коммерческой разработки от 5 лет.
Будет плюсом: Kubernetes, Kafka, CI/CD.
Обязанности: разрабатывать и поддерживать backend-сервисы, проектировать API,
участвовать в code review, взаимодействовать с командой аналитики и DevOps.
Мы предлагаем отличный коллектив, уютный офис и возможности роста.
""".strip()


def main() -> None:
    payload = {"vacancy_text": TEST_VACANCY}
    response = requests.post(URL, json=payload, timeout=60)

    print(f"Status code: {response.status_code}")
    try:
        print("Response JSON:", response.json())
    except Exception:
        print("Response text:", response.text)


if __name__ == "__main__":
    main()
