import type { MatchTeamMapVeto } from "./MatchTeamMapVeto.interface";

/**
 * Creates a mock MatchTeamMapVeto object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial MatchTeamMapVeto object to override defaults
 * @returns Complete MatchTeamMapVeto object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const veto = createMockMatchTeamMapVeto();
 *
 * // Override specific fields
 * const customVeto = createMockMatchTeamMapVeto({
 *   match_id: 123,
 *   team_id: 1650,
 *   action: "pick"
 * });
 * ```
 */
export const createMockMatchTeamMapVeto = (
  overrides?: Partial<MatchTeamMapVeto>
): MatchTeamMapVeto => {
  return {
    id: 1,
    match_id: 1,
    team_id: 1,
    map_id: 1,
    action: "drop",
    veto_order: 1,
    ...overrides
  };
};
