import type { PlayerTrade } from "./PlayerTrade.interface";

/**
 * Creates a mock PlayerTrade object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial PlayerTrade object to override defaults
 * @returns Complete PlayerTrade object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const playerTrade = createMockPlayerTrade();
 *
 * // Override specific fields
 * const customPlayerTrade = createMockPlayerTrade({
 *   match_game_id: 123,
 *   trader_steam_id: "76561198012345678",
 *   round_number: 5
 * });
 * ```
 */
export const createMockPlayerTrade = (
  overrides?: Partial<PlayerTrade>
): PlayerTrade => {
  return {
    id: 1,
    match_game_id: 1,
    trader_steam_id: "76561198012345678",
    killer_steam_id: "76561198012345679",
    victim_steam_id: "76561198012345680",
    round_number: 1,
    first_death: false,
    traded: false,
    attempted: false,
    time: null,
    trade_time: null,
    death_time: null,
    trade_denied: false,
    trade_timeout: false,
    denial_time: null,
    trade_window: null,
    ...overrides
  };
};
