import type { SeasonActiveMapPool } from "./SeasonActiveMapPool.interface";

/**
 * Creates a mock SeasonActiveMapPool object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial SeasonActiveMapPool object to override defaults
 * @returns Complete SeasonActiveMapPool object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const pool = createMockSeasonActiveMapPool();
 *
 * // Override specific fields
 * const customPool = createMockSeasonActiveMapPool({
 *   season_id: 5,
 *   map_id: 3
 * });
 * ```
 */
export const createMockSeasonActiveMapPool = (
  overrides?: Partial<SeasonActiveMapPool>
): SeasonActiveMapPool => {
  return {
    season_id: 1,
    map_id: 1,
    ...overrides
  };
};
