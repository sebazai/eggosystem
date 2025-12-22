import type { Game } from "./Game.interface";

/**
 * Creates a mock Game object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial Game object to override defaults
 * @returns Complete Game object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const game = createMockGame();
 *
 * // Override specific fields
 * const customGame = createMockGame({
 *   id: 1,
 *   name: "Counter-Strike 2",
 *   app_id: 730
 * });
 * ```
 */
export const createMockGame = (overrides?: Partial<Game>): Game => {
  return {
    id: 1,
    name: "Counter-Strike 2",
    abbreviation: "CS2",
    app_id: 730,
    ...overrides
  };
};
