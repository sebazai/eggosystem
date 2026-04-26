import type { MatchGame } from "./MatchGame.interface";

/**
 * Creates a mock MatchGame object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial MatchGame object to override defaults
 * @returns Complete MatchGame object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const matchGame = createMockMatchGame();
 *
 * // Override specific fields
 * const customMatchGame = createMockMatchGame({
 *   match_id: 123,
 *   map_id: 5,
 *   map_order: 1
 * });
 * ```
 */
export const createMockMatchGame = (
  overrides?: Partial<MatchGame>
): MatchGame => {
  return {
    id: 1,
    match_id: 1,
    map_id: 1,
    demofile: "test-demo.dem",
    map_order: null,
    regulation_rounds: 30,
    team_game_scores_staff_lock: false,
    ...overrides
  };
};
