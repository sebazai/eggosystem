import type { SeasonTeamRegistration } from "./SeasonTeamRegistration.interface";

/**
 * Creates a mock SeasonTeamRegistration object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial SeasonTeamRegistration object to override defaults
 * @returns Complete SeasonTeamRegistration object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const registration = createMockSeasonTeamRegistration();
 *
 * // Override specific fields
 * const customRegistration = createMockSeasonTeamRegistration({
 *   season_id: 14,
 *   team_id: 1650,
 *   approved: true
 * });
 * ```
 */
export const createMockSeasonTeamRegistration = (
  overrides?: Partial<SeasonTeamRegistration>
): SeasonTeamRegistration => {
  return {
    season_id: 1,
    team_id: 1,
    approved: false,
    approved_by: null,
    external_platform_id: null,
    terms_and_conditions_approved: false,
    manual_validity_check_override: null,
    manual_validity_check_by: null,
    ...overrides
  };
};
