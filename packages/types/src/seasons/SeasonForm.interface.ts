import { z } from "zod";
import { SeasonPlatform } from "../enums";
import { formatDateForDatabase } from "../utils/date-utils";

// Zod schema for season form validation
export const seasonFormSchema = z
  .object({
    game_id: z.number().min(1, "Game ID is required"),
    game_type_id: z.number().min(1, "Game type ID is required"),
    organizer_id: z.number().min(1, "Organizer ID is required"),
    name: z
      .string()
      .min(1, "Season name is required")
      .max(255, "Season name must be 255 characters or less"),
    full_name: z
      .string()
      .min(1, "Full season name is required")
      .max(255, "Full season name must be 255 characters or less"),
    signup_start_date: z
      .string()
      .refine((val) => {
        if (!val) return true;
        // Must be a valid ISO 8601 date string
        // If no timezone is specified, backend assumes UTC
        return !isNaN(Date.parse(val));
      }, "Signup start date must be in ISO 8601 format (e.g., '2025-01-15T10:30:00.000Z' or '2025-01-15T10:30:00.000'). If no timezone is specified, UTC is assumed.")
      .transform((val) => {
        // Transform UTC ISO string to MySQL datetime format
        // This happens at validation time, so controllers receive already-formatted values
        if (!val) return null;
        return formatDateForDatabase(val);
      })
      .optional()
      .nullable(),
    signup_end_date: z
      .string()
      .refine((val) => {
        if (!val) return true;
        // Must be a valid ISO 8601 date string
        // If no timezone is specified, backend assumes UTC
        return !isNaN(Date.parse(val));
      }, "Signup end date must be in ISO 8601 format (e.g., '2025-01-15T10:30:00.000Z' or '2025-01-15T10:30:00.000'). If no timezone is specified, UTC is assumed.")
      .transform((val) => {
        // Transform UTC ISO string to MySQL datetime format
        if (!val) return null;
        return formatDateForDatabase(val);
      })
      .optional()
      .nullable(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
      .optional()
      .nullable(),
    platform: z.enum(Object.values(SeasonPlatform), {
      message: "Invalid platform selection"
    }),
    is_round_robin_bo2_as_2xbo1: z.boolean(),
    grand_final_round_one_only: z.boolean(),
    payment_link: z
      .string()
      .url("Payment link must be a valid URL")
      .optional()
      .nullable(),
    registration_price: z
      .number()
      .min(0, "Registration price must be positive")
      .optional()
      .nullable(),
    has_vat: z.boolean(),
    early_bird_price_discount: z
      .number()
      .min(0, "Early bird discount must be positive")
      .max(1, "Early bird discount must be between 0 and 1")
      .optional()
      .nullable(),
    early_bird_price_discount_end_date: z
      .string()
      .refine((val) => {
        if (!val) return true;
        // Must be a valid ISO 8601 date string
        // If no timezone is specified, backend assumes UTC
        return !isNaN(Date.parse(val));
      }, "Early bird discount end date must be in ISO 8601 format (e.g., '2025-01-15T10:30:00.000Z' or '2025-01-15T10:30:00.000'). If no timezone is specified, UTC is assumed.")
      .transform((val) => {
        // Transform UTC ISO string to MySQL datetime format
        if (!val) return null;
        return formatDateForDatabase(val);
      })
      .optional()
      .nullable(),
    active_map_pool: z.array(z.number().int().positive()),
    rulebook_url: z
      .string()
      .url("Rulebook URL must be a valid URL")
      .optional()
      .nullable(),
    discord_link: z
      .string()
      .url("Discord link must be a valid URL")
      .optional()
      .nullable(),
    faceit_rank_required: z.boolean(),
    premier_rank_required: z.boolean(),
    hours_played_required: z.boolean(),
    min_players: z
      .number()
      .int()
      .min(1, "Minimum players must be at least 1")
      .max(20, "Minimum players must be 20 or less"),
    max_players: z
      .number()
      .int()
      .min(1, "Maximum players must be at least 1")
      .max(20, "Maximum players must be 20 or less")
  })
  .refine((data) => data.min_players <= data.max_players, {
    message: "Minimum players must be less than or equal to maximum players",
    path: ["max_players"]
  })
  .refine(
    (data) => {
      // If signup dates are provided, signup_start_date should be before signup_end_date
      // Note: At this point, dates are still ISO strings (before transform)
      if (data.signup_start_date && data.signup_end_date) {
        return (
          new Date(data.signup_start_date) < new Date(data.signup_end_date)
        );
      }
      return true;
    },
    {
      message: "Signup start date must be before signup end date",
      path: ["signup_end_date"]
    }
  )
  .refine(
    (data) => {
      // If end_date is provided, start_date should be before end_date
      if (data.end_date) {
        return new Date(data.start_date) < new Date(data.end_date);
      }
      return true;
    },
    {
      message: "Start date must be before end date",
      path: ["end_date"]
    }
  )
  .refine(
    (data) => {
      // If signup dates are provided, they should be before start_date
      if (data.signup_start_date) {
        return new Date(data.signup_start_date) < new Date(data.start_date);
      }
      if (data.signup_end_date) {
        return new Date(data.signup_end_date) < new Date(data.start_date);
      }
      return true;
    },
    {
      message: "Signup dates must be before season start date",
      path: ["signup_start_date"]
    }
  )
  // Non-Krafton (CS) seasons must have at least one map in the pool
  .refine(
    (data) =>
      data.platform === SeasonPlatform.Krafton ||
      data.active_map_pool.length > 0,
    {
      message: "At least one map must be selected",
      path: ["active_map_pool"]
    }
  )
  // FACEIT-only settings: 2xBO1 and faceit_rank_required are only valid on FACEIT platform
  .refine(
    (data) =>
      data.platform === SeasonPlatform.FACEIT ||
      !data.is_round_robin_bo2_as_2xbo1,
    {
      message:
        "Round robin BO2 as 2xBO1 is only available for FACEIT platform seasons",
      path: ["is_round_robin_bo2_as_2xbo1"]
    }
  )
  .refine(
    (data) =>
      data.platform === SeasonPlatform.FACEIT || !data.faceit_rank_required,
    {
      message:
        "FaceIT rank requirement is only available for FACEIT platform seasons",
      path: ["faceit_rank_required"]
    }
  )
  // Krafton (PUBG) seasons do not support CS2-specific rank/hours requirements
  .refine(
    (data) =>
      data.platform !== SeasonPlatform.Krafton || !data.premier_rank_required,
    {
      message: "Premier rank requirement is only available for CS2 seasons",
      path: ["premier_rank_required"]
    }
  )
  .refine(
    (data) =>
      data.platform !== SeasonPlatform.Krafton || !data.hours_played_required,
    {
      message: "Hours played requirement is only available for CS2 seasons",
      path: ["hours_played_required"]
    }
  );

// TypeScript type inferred from the Zod schema
export type SeasonFormValues = z.infer<typeof seasonFormSchema>;

/** JSON body for dashboard season create/update before Zod transforms. */
export type SeasonFormRequestBody = z.input<typeof seasonFormSchema>;

// Raw database interface (for database operations)
export interface SeasonFormRaw {
  game_id: number;
  game_type_id: number;
  organizer_id: number;
  name: string;
  full_name: string;
  /**
   * Signup start date in MySQL datetime format (e.g., '2025-01-15 10:30:00')
   * Transformed from UTC ISO string by Zod schema transform
   */
  signup_start_date: string | null;
  /**
   * Signup end date in MySQL datetime format (e.g., '2025-01-15 10:30:00')
   * Transformed from UTC ISO string by Zod schema transform
   */
  signup_end_date: string | null;
  /**
   * Start date as DATE (YYYY-MM-DD format)
   */
  start_date: string;
  /**
   * End date as DATE (YYYY-MM-DD format) or null
   */
  end_date: string | null;
  platform: SeasonPlatform;
  is_round_robin_bo2_as_2xbo1: boolean;
  grand_final_round_one_only: boolean;
  payment_link: string | null;
  registration_price: number | null;
  has_vat: boolean;
  early_bird_price_discount: number | null;
  /**
   * Early bird discount end date in MySQL datetime format (e.g., '2025-01-15 10:30:00')
   * Transformed from UTC ISO string by Zod schema transform
   */
  early_bird_price_discount_end_date: string | null;
  /**
   * Active map pool - array of map IDs that are active for this season
   * Must contain at least one map ID
   */
  active_map_pool: number[];
  /**
   * Rulebook URL for the season (nullable)
   */
  rulebook_url: string | null;
  /**
   * Discord link for the season (nullable)
   */
  discord_link: string | null;
  faceit_rank_required: boolean;
  premier_rank_required: boolean;
  hours_played_required: boolean;
  min_players: number;
  max_players: number;
}
