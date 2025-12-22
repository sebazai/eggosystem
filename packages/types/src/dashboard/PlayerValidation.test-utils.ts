import { SeasonPlatform } from "../enums";
import type {
  PlayerDetailsForDashboardBySteamId,
  PlayerValidationResult
} from "./PlayerValidation.interface";

/**
 * Creates a mock PlayerDetailsForDashboardBySteamId object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial PlayerDetailsForDashboardBySteamId object to override defaults
 * @returns Complete PlayerDetailsForDashboardBySteamId object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const playerDetails = createMockPlayerDetailsForDashboardBySteamId();
 *
 * // Override specific fields
 * const customPlayerDetails = createMockPlayerDetailsForDashboardBySteamId({
 *   steam_id: "76561198012345678",
 *   nickname: "TestPlayer"
 * });
 * ```
 */
export const createMockPlayerDetailsForDashboardBySteamId = (
  overrides?: Partial<PlayerDetailsForDashboardBySteamId>
): PlayerDetailsForDashboardBySteamId => {
  return {
    account_id: 1,
    steam_id: "76561198012345678",
    nickname: "Test Player",
    discord: null,
    discord_linked: false,
    work_email_verified: false,
    is_work_email_personal_email: false,
    is_valid_full_name: false,
    is_valid_work_email: false,
    work_email: null,
    ...overrides
  };
};

/**
 * Creates a mock PlayerValidationResult object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial PlayerValidationResult object to override defaults
 * @returns Complete PlayerValidationResult object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const validationResult = createMockPlayerValidationResult();
 *
 * // Override specific fields
 * const customValidationResult = createMockPlayerValidationResult({
 *   steam_id: "76561198012345678",
 *   season_id: 14,
 *   overall_success: true
 * });
 * ```
 */
export const createMockPlayerValidationResult = (
  overrides?: Partial<PlayerValidationResult>
): PlayerValidationResult => {
  return {
    steam_id: "76561198012345678",
    season_id: 1,
    app_id: 730,
    platform: SeasonPlatform.Kanaliiga,
    hours: {
      value: 1000,
      success: true,
      error: null
    },
    rank: {
      value: 15000,
      success: true,
      error: null
    },
    platform_rank: {
      value: 5,
      success: true,
      error: null
    },
    profile: {
      success: true,
      data: createMockPlayerDetailsForDashboardBySteamId(),
      error: null
    },
    overall_success: true,
    ...overrides
  };
};
