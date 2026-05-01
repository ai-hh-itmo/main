"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";
import {
  createRecommendationSchema,
  type RecommendationFormValues,
  type RecommendationPayload,
} from "@/lib/schemas";
import type { Dictionary } from "@/lib/i18n";

type RecommendationFormProps = {
  isPending: boolean;
  t: Dictionary;
  onSubmit: (values: RecommendationPayload) => void;
};

export function RecommendationForm({ isPending, t, onSubmit }: RecommendationFormProps) {
  const schema = useMemo(() => createRecommendationSchema(t), [t]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecommendationFormValues, unknown, RecommendationPayload>({
    resolver: zodResolver(schema),
    defaultValues: {
      vacancy_text: t.exampleVacancy,
      top_n: 20,
      top_k: 1000,
    },
  });

  return (
    <form className="flex h-full flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-[-0.02em]">{t.form.title}</p>
          <p className="mt-1 text-xs text-muted">{t.form.subtitle}</p>
        </div>
        <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">v1</span>
      </div>

      <div className="space-y-3">
        <Label htmlFor="vacancy_text">{t.form.vacancy}</Label>
        <Textarea
          id="vacancy_text"
          placeholder={t.form.placeholder}
          {...register("vacancy_text")}
        />
        <FieldError message={errors.vacancy_text?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor="top_n">{t.form.results}</Label>
          <Input id="top_n" min={1} max={500} type="number" {...register("top_n")} />
          <FieldError message={errors.top_n?.message} />
        </div>
        <div className="space-y-3">
          <Label htmlFor="top_k">{t.form.depth}</Label>
          <Input id="top_k" min={1} max={50000} type="number" {...register("top_k")} />
          <FieldError message={errors.top_k?.message} />
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted">
          <SlidersHorizontal className="size-4" aria-hidden />
          <span>{t.form.defaults}</span>
        </div>
        <Button className="w-full sm:w-auto" disabled={isPending} size="lg" type="submit">
          {isPending ? t.form.running : t.form.run}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </form>
  );
}
