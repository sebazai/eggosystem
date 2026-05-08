import { SeasonPlatform } from "../enums";
import type { SeasonFormValues, SeasonFormRaw } from "./SeasonForm.interface";

/**
 * Creates a mock SeasonFormValues object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial SeasonFormValues object to override defaults
 * @returns Complete SeasonFormValues object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const formValues = createMockSeasonFormValues();
 *
 * // Override specific fields
 * const customFormValues = createMockSeasonFormValues({
 *   name: "Custom Season",
 *   platform: SeasonPlatform.FACEIT,
 *   registration_price: 150
 * });
 * ```
 */
export const createMockSeasonFormValues = (
  overrides?: Partial<SeasonFormValues>
): SeasonFormValues => {
  return {
    game_id: 1,
    game_type_id: 1,
    organizer_id: 1,
    name: "Test Season",
    full_name: "Test Season Full Name",
    signup_start_date: "2024-01-01T00:00:00",
    signup_end_date: "2024-01-15T23:59:59",
    start_date: "2024-02-01",
    end_date: "2024-12-31",
    platform: SeasonPlatform.Kanaliiga,
    is_round_robin_bo2_as_2xbo1: false,
    payment_link: "https://example.com/payment",
    registration_price: 150,
    has_vat: true,
    active_map_pool: [1, 2, 3],
    ...overrides
  };
};

/**
 * Creates a mock SeasonFormRaw object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial SeasonFormRaw object to override defaults
 * @returns Complete SeasonFormRaw object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const formRaw = createMockSeasonFormRaw();
 *
 * // Override specific fields
 * const customFormRaw = createMockSeasonFormRaw({
 *   name: "Custom Season",
 *   platform: SeasonPlatform.FACEIT,
 *   registration_price: 150
 * });
 * ```
 */
export const createMockSeasonFormRaw = (
  overrides?: Partial<SeasonFormRaw>
): SeasonFormRaw => {
  return {
    game_id: 1,
    game_type_id: 1,
    organizer_id: 1,
    name: "Test Season",
    full_name: "Test Season Full Name",
    signup_start_date: "2024-01-01 00:00:00",
    signup_end_date: "2024-01-15 23:59:59",
    start_date: "2024-02-01",
    end_date: "2024-12-31",
    platform: SeasonPlatform.Kanaliiga,
    is_round_robin_bo2_as_2xbo1: false,
    payment_link: "https://example.com/payment",
    registration_price: 150,
    has_vat: true,
    early_bird_price_discount: null,
    early_bird_price_discount_end_date: null,
    active_map_pool: [1, 2, 3],
    rulebook_url: null,
    discord_link: null,
    faceit_rank_required: false,
    premier_rank_required: false,
    profile_link_required: false,
    hours_played_required: false,
    ...overrides
  };
};
