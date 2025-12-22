import { SeasonPlatform } from "../enums";
import type { InsertSeason, Season } from "./Season.interface";

/**
 * Creates a mock Season object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial Season object to override defaults
 * @returns Complete Season object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const season = createMockSeason();
 *
 * // Override specific fields
 * const customSeason = createMockSeason({
 *   id: 123,
 *   name: "Custom Season",
 *   platform: SeasonPlatform.FACEIT
 * });
 * ```
 */
export const createMockSeason = (overrides?: Partial<Season>): Season => {
  return {
    id: 1,
    game_id: 1,
    game_type_id: 1,
    organizer_id: 1,
    name: "Test Season",
    full_name: "Test Season Full Name",
    signup_start_date: "2024-01-01",
    signup_end_date: "2024-01-15",
    platform: SeasonPlatform.Kanaliiga,
    start_date: "2024-02-01",
    end_date: null,
    is_round_robin_bo2_as_2xbo1: false,
    grand_final_round_one_only: false,
    payment_link: null,
    registration_price: null,
    has_vat: true,
    early_bird_price_discount: null,
    early_bird_price_discount_end_date: null,
    ...overrides
  };
};

/**
 * Creates a mock InsertSeason object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial InsertSeason object to override defaults
 * @returns Complete InsertSeason object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const insertSeason = createMockInsertSeason();
 *
 * // Override specific fields
 * const customInsertSeason = createMockInsertSeason({
 *   id: 123,
 *   name: "Custom Season",
 *   platform: SeasonPlatform.FACEIT
 * });
 * ```
 */
export const createMockInsertSeason = (
  overrides?: Partial<InsertSeason>
): InsertSeason => {
  return {
    id: 1,
    game_id: 1,
    game_type_id: 1,
    organizer_id: 1,
    name: "Test Season",
    full_name: "Test Season Full Name",
    signup_start_date: new Date("2024-01-01"),
    signup_end_date: new Date("2024-01-15"),
    platform: SeasonPlatform.Kanaliiga,
    start_date: new Date("2024-02-01"),
    end_date: null,
    is_round_robin_bo2_as_2xbo1: false,
    payment_link: null,
    registration_price: null,
    has_vat: true,
    early_bird_price_discount: null,
    early_bird_price_discount_end_date: null,
    ...overrides
  };
};
