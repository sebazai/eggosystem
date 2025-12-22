import type { SeasonPlayerApprovals } from "./SeasonPlayerApprovals.interface";

/**
 * Creates a mock SeasonPlayerApprovals object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial SeasonPlayerApprovals object to override defaults
 * @returns Complete SeasonPlayerApprovals object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const approval = createMockSeasonPlayerApprovals();
 *
 * // Override specific fields
 * const customApproval = createMockSeasonPlayerApprovals({
 *   steam_id: "76561198012345678",
 *   season_id: 14,
 *   approved_by_id: 123
 * });
 * ```
 */
export const createMockSeasonPlayerApprovals = (
  overrides?: Partial<SeasonPlayerApprovals>
): SeasonPlayerApprovals => {
  const now = new Date().toISOString();
  return {
    id: 1,
    steam_id: "76561198012345678",
    season_id: 1,
    organization_id: 1,
    team_id: 1,
    approved_by_id: 1,
    approved_at: now,
    ticket_id: "TICKET-123",
    details: "Test approval details",
    ...overrides
  };
};
