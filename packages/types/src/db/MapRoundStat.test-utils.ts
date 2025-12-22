import { RoundEndReasonInfo } from "../enums";
import type { MapRoundStat } from "./MapRoundStat.interface";

/**
 * Creates a mock MapRoundStat object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial MapRoundStat object to override defaults
 * @returns Complete MapRoundStat object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const mapRoundStat = createMockMapRoundStat();
 *
 * // Override specific fields
 * const customMapRoundStat = createMockMapRoundStat({
 *   match_game_id: 123,
 *   round_number: 5,
 *   round_end_reason_info: 1
 * });
 * ```
 */
export const createMockMapRoundStat = (
  overrides?: Partial<MapRoundStat>
): MapRoundStat => {
  return {
    id: 1,
    match_game_id: 1,
    ct_team_id: 1,
    t_team_id: 2,
    round_number: 1,
    round_end_reason_info: RoundEndReasonInfo.T_Win,
    ct_t: null,
    first_kill: null,
    plant_site: null,
    ...overrides
  };
};
