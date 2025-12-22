import type { TeamRoster } from "./TeamRoster.interface";

/**
 * Creates a mock TeamRoster object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial TeamRoster object to override defaults
 * @returns Complete TeamRoster object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const roster = createMockTeamRoster();
 *
 * // Override specific fields
 * const customRoster = createMockTeamRoster({
 *   team_id: 1650,
 *   steam_id: "76561198012345678"
 * });
 * ```
 */
export const createMockTeamRoster = (
  overrides?: Partial<TeamRoster>
): TeamRoster => {
  return {
    id: 1,
    team_id: 1,
    steam_id: "76561198012345678",
    ...overrides
  };
};
