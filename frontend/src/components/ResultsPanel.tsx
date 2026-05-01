"use client";

import { AnimatePresence, motion } from "motion/react";
import { Circle, CircleDashed, TriangleAlert } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ApiErrorResponse, RecommendationResponse } from "@/lib/types";
import { formatScore, toPercent } from "@/lib/utils";

type ResultsPanelProps = {
  data?: RecommendationResponse;
  error?: ApiErrorResponse | null;
  isPending: boolean;
};

export function ResultsPanel({ data, error, isPending }: ResultsPanelProps) {
  const candidates = data?.top_candidates ?? [];
  const maxScore = Math.max(...candidates.map((candidate) => candidate.final_score), 0);

  return (
    <Card className="min-h-[32rem] overflow-hidden rounded-[24px] bg-panel/82 lg:min-h-full">
      <CardHeader className="p-4 pb-0 sm:p-5 sm:pb-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-[-0.02em]">Output</p>
            <p className="mt-1 text-xs text-muted">Ranked candidates from backend pipeline</p>
          </div>
          <StatusPill data={data} error={error} isPending={isPending} />
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        <AnimatePresence mode="popLayout">
          {isPending ? (
            <motion.div
              key="loading"
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2.5"
              exit={{ opacity: 0, y: -4 }}
              initial={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
            >
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  className="h-13 animate-pulse rounded-[16px] border border-line bg-[oklch(97%_0.006_260)]"
                  key={index}
                />
              ))}
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[18px] border border-[oklch(82%_0.08_28)] bg-[oklch(98%_0.018_28)] p-4 text-sm text-danger"
              exit={{ opacity: 0, y: -4 }}
              initial={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div className="space-y-2">
                  <p className="font-medium">Recommendation failed</p>
                  <p className="text-[oklch(44%_0.12_28)]">{error.error}</p>
                  {error.request_id ? (
                    <p className="font-mono text-xs text-[oklch(50%_0.06_28)]">
                      request {error.request_id}
                    </p>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ) : candidates.length > 0 ? (
            <motion.div
              key="results"
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2.5"
              exit={{ opacity: 0, y: -4 }}
              initial={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
            >
              {candidates.map((candidate, index) => (
                <motion.article
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[16px] border border-line bg-[oklch(99%_0.003_260)] p-3.5 transition-colors duration-200 hover:bg-panel"
                  initial={{ opacity: 0, y: 6 }}
                  key={candidate.candidate_id}
                  transition={{ delay: index * 0.018, duration: 0.2 }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted">#{String(index + 1).padStart(2, "0")}</p>
                      <h3 className="truncate text-base font-semibold tracking-[-0.02em]">
                        {candidate.candidate_id}
                      </h3>
                    </div>
                    <p className="font-mono text-sm text-ink">{formatScore(candidate.final_score)}</p>
                  </div>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-[oklch(93%_0.008_260)]">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
                      style={{ width: `${toPercent(candidate.final_score, maxScore)}%` }}
                    />
                  </div>
                </motion.article>
              ))}
              {data?.request_id ? (
                <p className="pt-2 font-mono text-xs text-muted">request {data.request_id}</p>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              animate={{ opacity: 1, y: 0 }}
              className="flex min-h-96 flex-col items-center justify-center rounded-[18px] border border-dashed border-line px-6 text-center"
              exit={{ opacity: 0, y: -4 }}
              initial={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
            >
              <CircleDashed className="size-8 text-faint" aria-hidden />
              <p className="mt-5 text-sm font-medium tracking-[-0.02em]">No run yet</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
                Submit a vacancy to see ranked candidate IDs and scores here.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function StatusPill({ data, error, isPending }: ResultsPanelProps) {
  if (isPending) {
    return <Pill label="Processing" tone="neutral" />;
  }

  if (error) {
    return <Pill label="Needs attention" tone="danger" />;
  }

  if (data) {
    return <Pill label="Ready" tone="success" />;
  }

  return <Pill label="Idle" tone="neutral" />;
}

function Pill({ label, tone }: { label: string; tone: "danger" | "neutral" | "success" }) {
  const iconClass =
    tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-faint";

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs font-medium text-muted">
      <Circle className={`size-2.5 fill-current ${iconClass}`} aria-hidden />
      {label}
    </span>
  );
}
