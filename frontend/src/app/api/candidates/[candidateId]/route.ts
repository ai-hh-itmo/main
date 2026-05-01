import { NextResponse, type NextRequest } from "next/server";

const recsysURL = process.env.RECSYS_URL ?? "http://localhost:8003";

type RouteContext = {
  params: Promise<{
    candidateId: string;
  }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  const { candidateId } = await context.params;

  try {
    const upstream = await fetch(
      `${recsysURL}/api/v1/rec-sys/candidates/${encodeURIComponent(candidateId)}`,
      { cache: "no-store" },
    );
    const payload = await upstream.json().catch(() => ({
      error: upstream.statusText || "Candidate service returned an empty response",
    }));

    return NextResponse.json(payload, { status: upstream.status });
  } catch {
    return NextResponse.json(
      {
        error: "Candidate service is unavailable. Check RECSYS_URL and service health.",
      },
      { status: 502 },
    );
  }
}
