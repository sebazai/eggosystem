import type { League } from "./League.interface";

/**
 * Creates a mock League object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial League object to override defaults
 * @returns Complete League object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const league = createMockLeague();
 *
 * // Override specific fields
 * const customLeague = createMockLeague({
 *   id: 1,
 *   name: "Division 1",
 *   sort_priority: 1
 * });
 * ```
 */
export const createMockLeague = (overrides?: Partial<League>): League => {
  return {
    id: 1,
    name: "Test League",
    sort_priority: 1,
    ...overrides
  };
};
