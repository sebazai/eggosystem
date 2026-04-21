import { z } from "zod";

/** ~9 MiB of characters — leaves headroom under Express `json({ limit: "10mb" })` for keys and JSON overhead */
export const marketingSponsorImageDataMaxChars = 9_437_184;

const imageDataFieldSchema = z
  .string()
  .min(1)
  .max(marketingSponsorImageDataMaxChars);

const marketingSponsorTierSchema = z.enum([
  "game_wide",
  "main_partner",
  "supporting_organization"
]);

export const createMarketingSponsorBodySchema = z.object({
  tier: marketingSponsorTierSchema,
  display_name: z.string().min(1).max(255),
  external_url: z.string().max(2048).nullable().optional(),
  display_order: z.number().int().min(0).optional(),
  image_data: imageDataFieldSchema.optional()
});

export const patchMarketingSponsorBodySchema = z
  .object({
    display_name: z.string().min(1).max(255).optional(),
    external_url: z.string().max(2048).nullable().optional(),
    display_order: z.number().int().min(0).optional(),
    enabled: z.boolean().optional(),
    tier: marketingSponsorTierSchema.optional(),
    image_data: imageDataFieldSchema.optional(),
    /** When true, clears stored logo (`image_phash`); mutually exclusive with `image_data` */
    clear_logo: z.literal(true).optional()
  })
  .superRefine((data, ctx) => {
    if (data.clear_logo === true && data.image_data !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "clear_logo cannot be combined with image_data",
        path: ["clear_logo"]
      });
    }
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
