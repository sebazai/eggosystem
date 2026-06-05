import type { GameType } from "./GameType.interface";

/**
 * Creates a mock GameType object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial GameType object to override defaults
 * @returns Complete GameType object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const gameType = createMockGameType();
 *
 * // Override specific fields
 * const customGameType = createMockGameType({
 *   id: 1,
 *   name: "Comp"
 * });
 * ```
 */
export const createMockGameType = (overrides?: Partial<GameType>): GameType => {
  return {
    id: 1,
    game_id: 1,
    name: "Comp",
    ...overrides
  };
};
