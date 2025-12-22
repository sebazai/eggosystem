import type { Map } from "./Map.interface";

/**
 * Creates a mock Map object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial Map object to override defaults
 * @returns Complete Map object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const map = createMockMap();
 *
 * // Override specific fields
 * const customMap = createMockMap({
 *   id: 5,
 *   name: "de_anubis"
 * });
 * ```
 */
export const createMockMap = (overrides?: Partial<Map>): Map => {
  return {
    id: 1,
    name: "de_dust2",
    ...overrides
  };
};
