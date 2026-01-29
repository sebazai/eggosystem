import type { PlayerRoundImpact } from "./PlayerRoundImpact.interface";

/**
 * Creates a mock PlayerRoundImpact object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial PlayerRoundImpact object to override defaults
 * @returns Complete PlayerRoundImpact object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * const impact = createMockPlayerRoundImpact();
 * const highImpact = createMockPlayerRoundImpact({ impact_score: 10, entry_kill: true });
 * ```
 */
export const createMockPlayerRoundImpact = (
  overrides?: Partial<PlayerRoundImpact>
): PlayerRoundImpact => {
  return {
    id: 1,
    match_game_id: 1,
    round_number: 1,
    player_steam_id: "76561198012345678",
    kills: 0,
    assists: 0,
    first_kill: false,
    trades: 0,
    damage_dealt: 0,
    flash_assists: 0,
    first_kill_flash_assists: 0,
    impact_score: 0,
    entry_kill: false,
    exit_kill: false,
    bomb_planted: false,
    bomb_defused: false,
    bomb_exploded: false,
    kill_opponent_value: 0,
    win_prob_impact: 0,
    trade_denials: 0,
    failed_trades: 0,
    trade_efficiency: 0,
    ...overrides
  };
};
