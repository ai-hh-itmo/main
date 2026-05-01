export const dictionaries = {
  en: {
    app: {
      console: "/ recommendation console",
    },
    language: {
      label: "Language",
      english: "EN",
      russian: "RU",
    },
    health: {
      checking: "Checking backend",
      online: "Backend online",
      offline: "Backend offline",
    },
    form: {
      title: "Input",
      subtitle: "Vacancy text and retrieval settings",
      vacancy: "Vacancy",
      placeholder:
        "Paste vacancy text, role requirements, responsibilities, stack, seniority...",
      results: "Results",
      depth: "Search pool",
      defaults: "Defaults: 20 / 1000",
      run: "Run",
      running: "Running",
    },
    results: {
      title: "Output",
      subtitle: "Ranked candidates",
      failedTitle: "Recommendation failed",
      request: "request",
      emptyTitle: "No run yet",
      emptyDescription: "Submit a vacancy to see ranked candidate IDs and scores here.",
      statuses: {
        processing: "Processing",
        attention: "Needs attention",
        ready: "Ready",
        idle: "Idle",
      },
    },
    validation: {
      vacancyMin: "Describe the role in at least a few sentences.",
      vacancyMax: "Keep the vacancy under 12,000 characters.",
    },
    errors: {
      serviceUnavailable: "Recommendation service is temporarily unavailable.",
    },
    exampleVacancy:
      "Senior Go backend engineer for a high-load HR recommendation platform. The role requires distributed systems experience, clean API design, observability, pragmatic ML-service integration, and ownership of production reliability.",
  },
  ru: {
    app: {
      console: "/ консоль рекомендаций",
    },
    language: {
      label: "Язык",
      english: "EN",
      russian: "RU",
    },
    health: {
      checking: "Проверяем backend",
      online: "Backend онлайн",
      offline: "Backend недоступен",
    },
    form: {
      title: "Ввод",
      subtitle: "Текст вакансии и параметры поиска",
      vacancy: "Вакансия",
      placeholder: "Вставьте текст вакансии, требования, обязанности, стек, уровень...",
      results: "Результаты",
      depth: "Пул поиска",
      defaults: "По умолчанию: 20 / 1000",
      run: "Запустить",
      running: "Выполняется",
    },
    results: {
      title: "Вывод",
      subtitle: "Ранжированные кандидаты",
      failedTitle: "Не удалось получить рекомендации",
      request: "запрос",
      emptyTitle: "Запуска еще не было",
      emptyDescription: "Отправьте вакансию, чтобы увидеть ID кандидатов и их score.",
      statuses: {
        processing: "Обработка",
        attention: "Требует внимания",
        ready: "Готово",
        idle: "Ожидание",
      },
    },
    validation: {
      vacancyMin: "Опишите роль хотя бы несколькими предложениями.",
      vacancyMax: "Сократите текст вакансии до 12 000 символов.",
    },
    errors: {
      serviceUnavailable: "Сервис рекомендаций временно недоступен.",
    },
    exampleVacancy:
      "Senior Go backend engineer для высоконагруженной HR-платформы рекомендаций. Нужен опыт распределенных систем, аккуратный дизайн API, observability, интеграция с ML-сервисами и ответственность за production reliability.",
  },
} as const;

export type Language = keyof typeof dictionaries;
export type Dictionary = (typeof dictionaries)[Language];

export const defaultLanguage: Language = "ru";
