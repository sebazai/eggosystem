import { z } from "zod";

export const casterApplicationFormSchema = z.object({
  caster_url: z
    .string()
    .min(1, "Stream URL is required")
    .url("Please enter a valid URL"),
  approved_terms_and_conditions: z.boolean().refine((v) => v === true, {
    message: "You must accept the terms to apply."
  })
});

export type CasterApplicationFormValues = z.infer<
  typeof casterApplicationFormSchema
>;
