import type { SeasonTeamPlayer } from "./SeasonTeamPlayer.interface";

/**
 * Creates a mock SeasonTeamPlayer object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial SeasonTeamPlayer object to override defaults
 * @returns Complete SeasonTeamPlayer object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const teamPlayer = createMockSeasonTeamPlayer();
 *
 * // Override specific fields
 * const customTeamPlayer = createMockSeasonTeamPlayer({
 *   season_id: 14,
 *   team_id: 1650,
 *   steam_id: "76561198012345678",
 *   role: "primary"
 * });
 * ```
 */
export const createMockSeasonTeamPlayer = (
  overrides?: Partial<SeasonTeamPlayer>
): SeasonTeamPlayer => {
  return {
    season_id: 1,
    team_id: 1,
    steam_id: "76561198012345678",
    role: "primary",
    is_captain: false,
    is_co_captain: false,
    match_id: null,
    ...overrides
  };
};
