import type { DashboardSeasonTeam } from "./DashboardSeasonTeam.interface";

/**
 * Creates a mock DashboardSeasonTeam object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial DashboardSeasonTeam object to override defaults
 * @returns Complete DashboardSeasonTeam object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const team = createMockDashboardSeasonTeam();
 *
 * // Override specific fields
 * const customTeam = createMockDashboardSeasonTeam({
 *   team_id: 1650,
 *   team_name: "Test Team",
 *   tier: 1
 * });
 * ```
 */
export const createMockDashboardSeasonTeam = (
  overrides?: Partial<DashboardSeasonTeam>
): DashboardSeasonTeam => {
  return {
    team_id: 1,
    team_name: "Test Team",
    league_name: "Test League",
    tier: null,
    ...overrides
  };
};
