import type { TeamGameScore } from "./TeamGameScore.interface";

/**
 * Creates a mock TeamGameScore object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial TeamGameScore object to override defaults
 * @returns Complete TeamGameScore object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const teamGameScore = createMockTeamGameScore();
 *
 * // Override specific fields
 * const customTeamGameScore = createMockTeamGameScore({
 *   match_id: 123,
 *   team_id: 1650,
 *   score: 16
 * });
 * ```
 */
export const createMockTeamGameScore = (
  overrides?: Partial<TeamGameScore>
): TeamGameScore => {
  return {
    id: 1,
    match_id: 1,
    team_id: 1,
    match_game_id: 1,
    starting_side: "CT",
    score: 0,
    halftime_score: 0,
    overtime_score: 0,
    ...overrides
  };
};
