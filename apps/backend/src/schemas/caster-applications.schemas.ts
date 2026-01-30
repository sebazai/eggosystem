import { z } from "zod";

export const casterApplicationSubmitBodySchema = z.object({
  caster_url: z
    .string()
    .url("Please enter a valid URL")
    .min(1, "Stream URL is required"),
  approved_terms_and_conditions: z.boolean().refine((v) => v === true, {
    message: "You must accept the terms to apply."
  })
});

export const casterApplicationRejectBodySchema = z.object({
  rejection_reason: z.string().min(1, "Rejection reason is required")
});
