"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";
import {
  recommendationSchema,
  type RecommendationFormValues,
  type RecommendationPayload,
} from "@/lib/schemas";

const exampleVacancy =
  "Senior Go backend engineer for a high-load HR recommendation platform. The role requires distributed systems experience, clean API design, observability, pragmatic ML-service integration, and ownership of production reliability.";

type RecommendationFormProps = {
  isPending: boolean;
  onSubmit: (values: RecommendationPayload) => void;
};

export function RecommendationForm({ isPending, onSubmit }: RecommendationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecommendationFormValues, unknown, RecommendationPayload>({
    resolver: zodResolver(recommendationSchema),
    defaultValues: {
      vacancy_text: exampleVacancy,
      top_n: 20,
      top_k: 1000,
    },
  });

  return (
    <form className="flex h-full flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-[-0.02em]">Input</p>
          <p className="mt-1 text-xs text-muted">Vacancy text and retrieval settings</p>
        </div>
        <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">v1</span>
      </div>

      <div className="space-y-3">
        <Label htmlFor="vacancy_text">Vacancy</Label>
        <Textarea
          id="vacancy_text"
          placeholder="Paste vacancy text, role requirements, responsibilities, stack, seniority..."
          {...register("vacancy_text")}
        />
        <FieldError message={errors.vacancy_text?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor="top_n">Results</Label>
          <Input id="top_n" min={1} max={500} type="number" {...register("top_n")} />
          <FieldError message={errors.top_n?.message} />
        </div>
        <div className="space-y-3">
          <Label htmlFor="top_k">Depth</Label>
          <Input id="top_k" min={1} max={50000} type="number" {...register("top_k")} />
          <FieldError message={errors.top_k?.message} />
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted">
          <SlidersHorizontal className="size-4" aria-hidden />
          <span>Defaults: 20 / 1000</span>
        </div>
        <Button className="w-full sm:w-auto" disabled={isPending} size="lg" type="submit">
          {isPending ? "Running" : "Run"}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </form>
  );
}
