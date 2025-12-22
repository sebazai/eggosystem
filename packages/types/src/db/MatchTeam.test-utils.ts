import type { MatchTeam } from "./MatchTeam.interface";

/**
 * Creates a mock MatchTeam object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial MatchTeam object to override defaults
 * @returns Complete MatchTeam object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const matchTeam = createMockMatchTeam();
 *
 * // Override specific fields
 * const customMatchTeam = createMockMatchTeam({
 *   match_id: 123,
 *   team_id: 1650,
 *   season_id: 14
 * });
 * ```
 */
export const createMockMatchTeam = (
  overrides?: Partial<MatchTeam>
): MatchTeam => {
  return {
    match_id: 1,
    team_id: 1,
    season_id: 1,
    league_id: 1,
    ...overrides
  };
};
