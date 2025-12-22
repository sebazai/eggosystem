import type { PlayerStats } from "./PlayerStat.interface";

/**
 * Creates a mock PlayerStats object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial PlayerStats object to override defaults
 * @returns Complete PlayerStats object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const playerStats = createMockPlayerStats();
 *
 * // Override specific fields
 * const customPlayerStats = createMockPlayerStats({
 *   steam_id: "76561198012345678",
 *   match_game_id: 123,
 *   kills: 25,
 *   deaths: 15
 * });
 * ```
 */
export const createMockPlayerStats = (
  overrides?: Partial<PlayerStats>
): PlayerStats => {
  return {
    id: 1,
    steam_id: "76561198012345678",
    match_game_id: 1,
    kills: 0,
    kills_t: null,
    kills_ct: null,
    deaths: 0,
    deaths_t: null,
    deaths_ct: null,
    assists: 0,
    assists_t: 0,
    assists_ct: 0,
    mvps: 0,
    total_damage: 0,
    total_damage_t: 0,
    total_damage_ct: 0,
    headshots: 0,
    flash_assists: 0,
    flash_assists_t: 0,
    flash_assists_ct: 0,
    adr: 0,
    adr_t: null,
    adr_ct: null,
    hs_percent: 0,
    plants: 0,
    explodes: 0,
    defuses: 0,
    kills_1: 0,
    kills_2: 0,
    kills_3: 0,
    kills_4: 0,
    kills_5: 0,
    trades: 0,
    trades_t: null,
    trades_ct: null,
    traded: 0,
    traded_t: null,
    traded_ct: null,
    clutches: 0,
    clutches_won: 0,
    awp_kills: 0,
    utility_damage: 0,
    utility_damage_t: 0,
    utility_damage_ct: 0,
    molotov_damage: 0,
    molotov_damage_t: 0,
    molotov_damage_ct: 0,
    he_damage: 0,
    he_damage_t: 0,
    he_damage_ct: 0,
    trade_attempts: 0,
    trade_attempts_t: 0,
    trade_attempts_ct: 0,
    kills_through_walls: 0,
    first_death_trade_attempts: 0,
    first_death_trade_attempts_ct: 0,
    first_death_trade_attempts_t: 0,
    first_death_trade_opportunities: 0,
    first_death_trade_opportunities_t: 0,
    first_death_trade_opportunities_ct: 0,
    trade_opportunities: 0,
    trade_opportunities_t: 0,
    trade_opportunities_ct: 0,
    flashes_thrown: 0,
    flashes_thrown_t: null,
    flashes_thrown_ct: null,
    enemies_flashed: 0,
    enemies_flashed_t: null,
    enemies_flashed_ct: null,
    mates_flashed: 0,
    mates_flashed_t: null,
    mates_flashed_ct: null,
    self_flashes: 0,
    total_mf_duration: 0,
    total_mf_duration_t: null,
    total_mf_duration_ct: null,
    total_ef_duration: 0,
    total_ef_duration_t: null,
    total_ef_duration_ct: null,
    one_v_one_won: 0,
    one_v_one_won_t: null,
    one_v_one_won_ct: null,
    one_v_one_lost: 0,
    one_v_one_lost_t: null,
    one_v_one_lost_ct: null,
    first_kills: 0,
    first_kills_t: null,
    first_kills_ct: null,
    first_deaths: 0,
    first_deaths_t: null,
    first_deaths_ct: null,
    first_death_trades: 0,
    first_death_trades_t: 0,
    first_death_trades_ct: 0,
    first_death_traded: 0,
    first_death_traded_t: 0,
    first_death_traded_ct: 0,
    kast: 0,
    kana_rating: 0,
    ttd: null,
    ttf: null,
    rws: 0,
    crosshair_placement: null,
    shots: null,
    shots_hit: null,
    total_strafing_shots: null,
    good_strafing_shots: null,
    ...overrides
  };
};
