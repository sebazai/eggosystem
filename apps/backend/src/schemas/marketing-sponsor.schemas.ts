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

export const createMarketingSponsorBodySchema = z
  .object({
    tier: marketingSponsorTierSchema,
    /** Required when `tier` is `game_wide` (must reference an existing game). */
    game_id: z.number().int().positive().optional(),
    display_name: z.string().min(1).max(255),
    external_url: z.string().max(2048).nullable().optional(),
    display_order: z.number().int().min(0).optional(),
    image_data: imageDataFieldSchema.optional(),
    /** Optional footer-specific logo (stored as `footer_image_phash`); see patch schema */
    footer_image_data: imageDataFieldSchema.optional()
  })
  .superRefine((data, ctx) => {
    if (data.tier === "game_wide" && data.game_id === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "game_id is required for game_wide tier",
        path: ["game_id"]
      });
    }
    if (data.tier !== "game_wide" && data.game_id !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "game_id is only allowed for game_wide tier",
        path: ["game_id"]
      });
    }
  });

export const patchMarketingSponsorBodySchema = z
  .object({
    display_name: z.string().min(1).max(255).optional(),
    external_url: z.string().max(2048).nullable().optional(),
    display_order: z.number().int().min(0).optional(),
    enabled: z.boolean().optional(),
    tier: marketingSponsorTierSchema.optional(),
    game_id: z.number().int().positive().nullable().optional(),
    image_data: imageDataFieldSchema.optional(),
    footer_image_data: imageDataFieldSchema.optional(),
    /** When true, clears stored logo (`image_phash`); mutually exclusive with `image_data` */
    clear_logo: z.literal(true).optional(),
    /** When true, clears stored footer logo (`footer_image_phash`); mutually exclusive with `footer_image_data` */
    clear_footer_logo: z.literal(true).optional()
  })
  .superRefine((data, ctx) => {
    if (data.clear_logo === true && data.image_data !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "clear_logo cannot be combined with image_data",
        path: ["clear_logo"]
      });
    }
    if (
      data.clear_footer_logo === true &&
      data.footer_image_data !== undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "clear_footer_logo cannot be combined with footer_image_data",
        path: ["clear_footer_logo"]
      });
    }
  });

export const reorderMarketingSponsorsBodySchema = z
  .object({
    tier: marketingSponsorTierSchema,
    /** Required when `tier` is `game_wide` — scope reorder to that game’s rows. */
    game_id: z.number().int().positive().optional(),
    ordered_ids: z.array(z.number().int().positive())
  })
  .superRefine((val, ctx) => {
    if (val.tier === "game_wide" && val.game_id === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "game_id is required when reordering game_wide sponsors",
        path: ["game_id"]
      });
    }
    if (val.tier !== "game_wide" && val.game_id !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "game_id must not be set unless tier is game_wide",
        path: ["game_id"]
      });
    }
    if (new Set(val.ordered_ids).size !== val.ordered_ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ordered_ids must be unique"
      });
    }
  });
