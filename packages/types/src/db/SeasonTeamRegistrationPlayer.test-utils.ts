import type { SeasonTeamRegistrationPlayer } from "./SeasonTeamRegistrationPlayer.interface";

/**
 * Creates a mock SeasonTeamRegistrationPlayer object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial SeasonTeamRegistrationPlayer object to override defaults
 * @returns Complete SeasonTeamRegistrationPlayer object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const registrationPlayer = createMockSeasonTeamRegistrationPlayer();
 *
 * // Override specific fields
 * const customRegistrationPlayer = createMockSeasonTeamRegistrationPlayer({
 *   season_id: 14,
 *   team_id: 1650,
 *   steam_id: "76561198012345678",
 *   is_captain: true
 * });
 * ```
 */
export const createMockSeasonTeamRegistrationPlayer = (
  overrides?: Partial<SeasonTeamRegistrationPlayer>
): SeasonTeamRegistrationPlayer => {
  return {
    season_id: 1,
    team_id: 1,
    steam_id: "76561198012345678",
    is_captain: false,
    is_co_captain: false,
    ...overrides
  };
};
