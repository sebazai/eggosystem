import type { Stage } from "./Stage.interface";

/**
 * Creates a mock Stage object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial Stage object to override defaults
 * @returns Complete Stage object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const stage = createMockStage();
 *
 * // Override specific fields
 * const customStage = createMockStage({
 *   id: 1,
 *   name: "Regular Season"
 * });
 * ```
 */
export const createMockStage = (overrides?: Partial<Stage>): Stage => {
  return {
    id: 1,
    name: "Regular Season",
    ...overrides
  };
};
