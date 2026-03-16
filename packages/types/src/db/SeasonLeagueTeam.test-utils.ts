import type { SeasonLeagueTeam } from "./SeasonLeagueTeam.interface";

/**
 * Creates a mock SeasonLeagueTeam object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial SeasonLeagueTeam object to override defaults
 * @returns Complete SeasonLeagueTeam object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const seasonLeagueTeam = createMockSeasonLeagueTeam();
 *
 * // Override specific fields
 * const customSeasonLeagueTeam = createMockSeasonLeagueTeam({
 *   season_id: 14,
 *   team_id: 1650,
 *   league_id: 1,
 *   placement: 1
 * });
 * ```
 */
export const createMockSeasonLeagueTeam = (
  overrides?: Partial<SeasonLeagueTeam>
): SeasonLeagueTeam => {
  return {
    season_id: 1,
    team_id: 1,
    league_id: 1,
    placement: null,
    position_offset: null,
    playoff_seed: null,
    ...overrides
  };
};
