import { z } from "zod";

export const recommendationSchema = z.object({
  vacancy_text: z
    .string()
    .trim()
    .min(24, "Describe the role in at least a few sentences.")
    .max(12000, "Keep the vacancy under 12,000 characters."),
  top_n: z.coerce.number().int().min(1).max(500).default(20),
  top_k: z.coerce.number().int().min(1).max(50000).default(1000),
});

export type RecommendationFormValues = z.input<typeof recommendationSchema>;
export type RecommendationPayload = z.output<typeof recommendationSchema>;
