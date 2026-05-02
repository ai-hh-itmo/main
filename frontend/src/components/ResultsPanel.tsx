"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { BriefcaseBusiness, ChevronDown, CircleDashed, History, MailCheck, TriangleAlert, WalletCards } from "lucide-react";
import { useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { fetchCandidateDetails } from "@/lib/api";
import type { Dictionary } from "@/lib/i18n";
import type { ApiErrorResponse, Candidate, CandidateDetails, RecommendationResponse } from "@/lib/types";
import { formatScore, toPercent } from "@/lib/utils";

type ResultsPanelProps = {
  data?: RecommendationResponse;
  error?: ApiErrorResponse | null;
  isPending: boolean;
  t: Dictionary;
};

export function ResultsPanel({ data, error, isPending, t }: ResultsPanelProps) {
  const [selectedCandidateID, setSelectedCandidateID] = useState<string | null>(null);
  const candidates = data?.top_candidates ?? [];
  const maxScore = Math.max(...candidates.map((candidate) => candidate.final_score), 0);
  const detailsQuery = useQuery({
    queryKey: ["candidate-details", selectedCandidateID],
    queryFn: () => fetchCandidateDetails(selectedCandidateID ?? ""),
    enabled: Boolean(selectedCandidateID),
    staleTime: 5 * 60 * 1000,
  });
  const errorMessage =
    error?.error === "recommendation service is temporarily unavailable"
      ? t.errors.serviceUnavailable
      : error?.error;

  function toggleCandidate(candidateID: string) {
    setSelectedCandidateID((current) => (current === candidateID ? null : candidateID));
  }

  return (
    <Card className="min-h-[32rem] overflow-hidden rounded-[24px] bg-panel/82 lg:min-h-full">
      <CardHeader className="p-4 pb-0 sm:p-5 sm:pb-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-[-0.02em]">{t.results.title}</p>
            <p className="mt-1 text-xs text-muted">{t.results.subtitle}</p>
          </div>
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
                  <p className="font-medium">{t.results.failedTitle}</p>
                  <p className="text-[oklch(44%_0.12_28)]">{errorMessage}</p>
                  {error.request_id ? (
                    <p className="font-mono text-xs text-[oklch(50%_0.06_28)]">
                      {t.results.request} {error.request_id}
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
              {candidates.map((candidate, index) => {
                const isSelected = selectedCandidateID === candidate.candidate_id;
                return (
                  <CandidateResult
                    candidate={candidate}
                    details={isSelected ? detailsQuery.data : undefined}
                    detailsError={isSelected ? detailsQuery.error : null}
                    detailsPending={isSelected && detailsQuery.isPending}
                    index={index}
                    isSelected={isSelected}
                    key={candidate.candidate_id}
                    maxScore={maxScore}
                    onToggle={() => toggleCandidate(candidate.candidate_id)}
                  />
                );
              })}
              {data?.request_id ? (
                <p className="pt-2 font-mono text-xs text-muted">
                  {t.results.request} {data.request_id}
                </p>
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
              <p className="mt-5 text-sm font-medium tracking-[-0.02em]">
                {t.results.emptyTitle}
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{t.results.emptyDescription}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

type CandidateResultProps = {
  candidate: Candidate;
  details?: CandidateDetails;
  detailsError?: ApiErrorResponse | Error | null;
  detailsPending: boolean;
  index: number;
  isSelected: boolean;
  maxScore: number;
  onToggle: () => void;
};

function CandidateResult({
  candidate,
  details,
  detailsError,
  detailsPending,
  index,
  isSelected,
  maxScore,
  onToggle,
}: CandidateResultProps) {
  const displayName = details?.display_name ?? candidate.display_name ?? candidate.candidate_id;

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[16px] border border-line bg-[oklch(99%_0.003_260)] transition-colors duration-200 hover:bg-panel"
      initial={{ opacity: 0, y: 6 }}
      transition={{ delay: index * 0.018, duration: 0.2 }}
    >
      <button
        aria-expanded={isSelected}
        className="w-full p-3.5 text-left"
        onClick={onToggle}
        type="button"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted">#{String(index + 1).padStart(2, "0")}</p>
            <h3 className="truncate text-base font-semibold tracking-[-0.02em]">
              {displayName}
            </h3>
            <p className="mt-0.5 font-mono text-xs text-muted">{candidate.candidate_id}</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="font-mono text-sm text-ink">{formatScore(candidate.final_score)}</p>
            <ChevronDown
              aria-hidden
              className={`size-4 text-muted transition-transform duration-200 ${isSelected ? "rotate-180" : ""}`}
            />
          </div>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-[oklch(93%_0.008_260)]">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
            style={{ width: `${toPercent(candidate.final_score, maxScore)}%` }}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isSelected ? (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="border-t border-line px-3.5 pb-3.5"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <CandidateDetailsView
              details={details}
              error={detailsError}
              isPending={detailsPending}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}

function CandidateDetailsView({
  details,
  error,
  isPending,
}: {
  details?: CandidateDetails;
  error?: ApiErrorResponse | Error | null;
  isPending: boolean;
}) {
  if (isPending) {
    return (
      <div className="mt-3 space-y-2">
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-[oklch(92%_0.01_260)]" />
        <div className="h-16 animate-pulse rounded-[12px] bg-[oklch(96%_0.006_260)]" />
      </div>
    );
  }

  if (error) {
    return <p className="mt-3 text-sm text-danger">Candidate details are unavailable.</p>;
  }

  if (!details) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <DetailMetric icon={BriefcaseBusiness} label="Experience" value={formatYears(details.exp_years)} />
        <DetailMetric icon={History} label="History" value={formatCount(details.history_appearances)} />
        <DetailMetric icon={MailCheck} label="Contacted" value={formatBoolean(details.has_contacted)} />
        <DetailMetric icon={WalletCards} label="Salary" value={formatMoney(details.salary_expectation)} />
      </div>
      {details.resume ? (
        <p className="rounded-[12px] border border-line bg-panel/72 p-3 text-sm leading-6 text-muted">
          {details.resume}
        </p>
      ) : null}
    </div>
  );
}

function DetailMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BriefcaseBusiness;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[12px] border border-line bg-panel/72 px-3 py-2">
      <Icon className="size-4 shrink-0 text-muted" aria-hidden />
      <div className="min-w-0">
        <p className="text-[0.68rem] uppercase text-muted">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function formatBoolean(value?: boolean | null) {
  if (value == null) {
    return "Unknown";
  }
  return value ? "Yes" : "No";
}

function formatCount(value?: number | null) {
  return value == null ? "Unknown" : String(value);
}

function formatMoney(value?: number | null) {
  if (value == null) {
    return "Unknown";
  }
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "RUB",
  }).format(value);
}

function formatYears(value?: number | null) {
  return value == null ? "Unknown" : `${value} yr`;
}
