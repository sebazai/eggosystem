import type { SeasonLeagueExternalId } from "./SeasonLeagueExternalId.interface";

/**
 * Creates a mock SeasonLeagueExternalId object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial SeasonLeagueExternalId object to override defaults
 * @returns Complete SeasonLeagueExternalId object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const externalId = createMockSeasonLeagueExternalId();
 *
 * // Override specific fields
 * const customExternalId = createMockSeasonLeagueExternalId({
 *   external_id: "abc123",
 *   external_league_name: "Test League",
 *   type: "doubleElimination"
 * });
 * ```
 */
export const createMockSeasonLeagueExternalId = (
  overrides?: Partial<SeasonLeagueExternalId>
): SeasonLeagueExternalId => {
  return {
    id: 1,
    external_id: "test-external-id",
    external_league_name: "Test External League",
    stage_id: 1,
    season_id: 1,
    league_id: 1,
    type: "roundRobin",
    manual_group: undefined,
    ...overrides
  };
};
