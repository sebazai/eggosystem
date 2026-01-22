import type { Match } from "./Match.interface";

/**
 * Creates a mock Match object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial Match object to override defaults
 * @returns Complete Match object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const match = createMockMatch();
 *
 * // Override specific fields
 * const customMatch = createMockMatch({
 *   id: 123,
 *   season_id: 14,
 *   league_id: 1,
 *   status: "FINISHED"
 * });
 * ```
 */
export const createMockMatch = (overrides?: Partial<Match>): Match => {
  return {
    id: 1,
    league_id: 1,
    season_id: 1,
    stage: 1,
    start_timestamp: "2024-01-01T18:00:00.000Z",
    end_timestamp: "2024-01-01T20:00:00.000Z",
    best_of: 1,
    external_match_room_id: null,
    status: "SCHEDULED" as const,
    round: 1,
    group: 1,
    ...overrides
  };
};
