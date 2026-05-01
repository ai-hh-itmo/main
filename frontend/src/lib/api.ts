import type {
  ApiErrorResponse,
  HealthResponse,
  RecommendationRequest,
  RecommendationResponse,
} from "@/lib/types";

async function parseError(response: Response): Promise<ApiErrorResponse> {
  const fallback = {
    error: response.statusText || "Request failed",
    status: response.status,
    request_id: response.headers.get("x-request-id") ?? undefined,
  };

  try {
    return { ...fallback, ...(await response.json()) };
  } catch {
    return fallback;
  }
}

export async function fetchHealth() {
  const response = await fetch("/api/health", { cache: "no-store" });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as HealthResponse;
}

export async function createRecommendations(payload: RecommendationRequest) {
  const response = await fetch("/api/recommendations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as RecommendationResponse;
}
