import type { Organizer } from "./Organizer.interface";

/**
 * Creates a mock Organizer object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial Organizer object to override defaults
 * @returns Complete Organizer object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const organizer = createMockOrganizer();
 *
 * // Override specific fields
 * const customOrganizer = createMockOrganizer({
 *   id: 123,
 *   name: "Test Organizer",
 *   faceit_id: "abc123"
 * });
 * ```
 */
export const createMockOrganizer = (
  overrides?: Partial<Organizer>
): Organizer => {
  return {
    id: 1,
    name: "Test Organizer",
    faceit_id: "test-faceit-id",
    discord_link: null,
    ...overrides
  };
};
