import type { Team } from "./Team.interface";

/**
 * Creates a mock Team object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial Team object to override defaults
 * @returns Complete Team object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const team = createMockTeam();
 *
 * // Override specific fields
 * const customTeam = createMockTeam({
 *   id: 123,
 *   name: "Test Team",
 *   org_approved: true
 * });
 * ```
 */
export const createMockTeam = (overrides?: Partial<Team>): Team => {
  return {
    id: 1,
    organization_id: null,
    name: "Test Team",
    team_logo: "test-logo-id",
    org_approved: false,
    ...overrides
  };
};
