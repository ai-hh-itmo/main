import { NextResponse } from "next/server";

const backendURL = process.env.BACKEND_URL ?? "http://localhost:8080";

export async function GET() {
  try {
    const upstream = await fetch(`${backendURL}/health`, {
      cache: "no-store",
    });
    const requestID = upstream.headers.get("x-request-id") ?? undefined;
    const payload = await upstream.json().catch(() => ({ status: "unknown" }));

    return NextResponse.json(
      {
        ...payload,
        backend_available: upstream.ok,
        request_id: requestID,
      },
      {
        status: upstream.ok ? 200 : 502,
        headers: requestID ? { "X-Request-Id": requestID } : undefined,
      },
    );
  } catch {
    return NextResponse.json(
      {
        status: "offline",
        backend_available: false,
        error: "Backend is unavailable",
      },
      { status: 502 },
    );
  }
}
