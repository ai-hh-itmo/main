import { NextResponse, type NextRequest } from "next/server";

import { recommendationSchema } from "@/lib/schemas";

const backendURL = process.env.BACKEND_URL ?? "http://localhost:8080";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = recommendationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "invalid request",
      },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(`${backendURL}/api/v1/recommendations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": request.headers.get("x-request-id") ?? crypto.randomUUID(),
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });

    const requestID = upstream.headers.get("x-request-id") ?? undefined;
    const payload = await upstream.json().catch(() => ({
      error: upstream.statusText || "Backend returned an empty response",
    }));

    return NextResponse.json(
      {
        ...payload,
        request_id: requestID,
      },
      {
        status: upstream.status,
        headers: requestID ? { "X-Request-Id": requestID } : undefined,
      },
    );
  } catch {
    return NextResponse.json(
      {
        error: "Backend is unavailable. Check BACKEND_URL and service health.",
      },
      { status: 502 },
    );
  }
}
