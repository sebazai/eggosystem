import type { SeasonLeague } from "./SeasonLeague.interface";

/**
 * Creates a mock SeasonLeague object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial SeasonLeague object to override defaults
 * @returns Complete SeasonLeague object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const seasonLeague = createMockSeasonLeague();
 *
 * // Override specific fields
 * const customSeasonLeague = createMockSeasonLeague({
 *   season_id: 14,
 *   league_id: 1,
 *   tier: 1
 * });
 * ```
 */
export const createMockSeasonLeague = (
  overrides?: Partial<SeasonLeague>
): SeasonLeague => {
  return {
    tier: 1,
    season_id: 1,
    league_id: 1,
    ...overrides
  };
};
