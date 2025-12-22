import type { PlayerFullName } from "./PlayerFullName.interface";

/**
 * Creates a mock PlayerFullName object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial PlayerFullName object to override defaults
 * @returns Complete PlayerFullName object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const playerFullName = createMockPlayerFullName();
 *
 * // Override specific fields
 * const customPlayerFullName = createMockPlayerFullName({
 *   steam_id: "76561198012345678",
 *   full_name: "John Doe"
 * });
 * ```
 */
export const createMockPlayerFullName = (
  overrides?: Partial<PlayerFullName>
): PlayerFullName => {
  return {
    steam_id: "76561198012345678",
    full_name: "Test User",
    ...overrides
  };
};
