import type { PlayerClutch } from "./PlayerClutch.interface";

/**
 * Creates a mock PlayerClutch object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial PlayerClutch object to override defaults
 * @returns Complete PlayerClutch object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * const playerClutch = createMockPlayerClutch();
 * const wonClutch = createMockPlayerClutch({ won: true, end_info: "Kill" });
 * ```
 */
export const createMockPlayerClutch = (
  overrides?: Partial<PlayerClutch>
): PlayerClutch => {
  return {
    id: 1,
    match_game_id: 1,
    round_number: 1,
    player_steam_id: "76561198012345678",
    player_team: "CT",
    won: false,
    clutch_start_enemies: 2,
    kills: 1,
    end_info: "Lost",
    ...overrides
  };
};
