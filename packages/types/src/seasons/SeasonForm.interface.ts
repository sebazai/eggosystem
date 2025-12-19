import { z } from "zod";
import { SeasonPlatform } from "../enums";

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
      .refine(
        (val) => !val || !isNaN(Date.parse(val)),
        "Invalid signup start date format"
      )
      .optional()
      .nullable(),
    signup_end_date: z
      .string()
      .refine(
        (val) => !val || !isNaN(Date.parse(val)),
        "Invalid signup end date format"
      )
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
    platform: z.enum(
      Object.values(SeasonPlatform) as [SeasonPlatform, ...SeasonPlatform[]],
      {
        message: "Invalid platform selection"
      }
    ),
    is_round_robin_bo2_as_2xbo1: z.boolean(),
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
    timezone: z.string().optional()
  })
  .refine(
    (data) => {
      // If signup dates are provided, signup_start_date should be before signup_end_date
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
  );

// TypeScript type inferred from the Zod schema
export type SeasonFormValues = z.infer<typeof seasonFormSchema>;

// Raw database interface (for database operations)
export interface SeasonFormRaw {
  game_id: number;
  game_type_id: number;
  organizer_id: number;
  name: string;
  full_name: string;
  signup_start_date: string | null;
  signup_end_date: string | null;
  start_date: string;
  end_date: string | null;
  platform: SeasonPlatform;
  is_round_robin_bo2_as_2xbo1: boolean;
  payment_link: string | null;
  registration_price: number | null;
  has_vat: boolean;
}
