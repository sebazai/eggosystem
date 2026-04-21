import { z } from "zod";

export const marketingSponsorTierSchema = z.enum([
  "game_wide",
  "main_partner",
  "supporting_organization"
]);

export const createMarketingSponsorBodySchema = z.object({
  tier: marketingSponsorTierSchema,
  display_name: z.string().min(1).max(255),
  external_url: z.string().max(2048).nullable().optional(),
  display_order: z.number().int().min(0).optional(),
  image_data: z.string().min(1).optional()
});

export const patchMarketingSponsorBodySchema = z.object({
  display_name: z.string().min(1).max(255).optional(),
  external_url: z.string().max(2048).nullable().optional(),
  display_order: z.number().int().min(0).optional(),
  enabled: z.boolean().optional(),
  tier: marketingSponsorTierSchema.optional(),
  image_data: z.string().min(1).optional()
});

export const reorderMarketingSponsorsBodySchema = z
  .object({
    tier: marketingSponsorTierSchema,
    ordered_ids: z.array(z.number().int().positive())
  })
  .superRefine((val, ctx) => {
    if (new Set(val.ordered_ids).size !== val.ordered_ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ordered_ids must be unique"
      });
    }
  });
