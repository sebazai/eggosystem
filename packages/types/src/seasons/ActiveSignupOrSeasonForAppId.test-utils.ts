import { SeasonPlatform } from "../enums";
import type { ActiveSignupOrSeasonForAppId } from "./ActiveSignupOrSeasonForAppId.interface";

/**
 * Creates a mock ActiveSignupOrSeasonForAppId object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial ActiveSignupOrSeasonForAppId object to override defaults
 * @returns Complete ActiveSignupOrSeasonForAppId object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const activeSeason = createMockActiveSignupOrSeasonForAppId();
 *
 * // Override specific fields
 * const customActiveSeason = createMockActiveSignupOrSeasonForAppId({
 *   season_id: 14,
 *   platform: SeasonPlatform.FACEIT,
 *   full_name: "CS2 Season 2"
 * });
 * ```
 */
export const createMockActiveSignupOrSeasonForAppId = (
  overrides?: Partial<ActiveSignupOrSeasonForAppId>
): ActiveSignupOrSeasonForAppId => {
  return {
    season_id: 1,
    platform: SeasonPlatform.Kanaliiga,
    signup_start_date: "2024-01-01",
    signup_end_date: "2024-01-15",
    start_date: "2024-02-01",
    end_date: null,
    full_name: "Test Season Full Name",
    ...overrides
  };
};
