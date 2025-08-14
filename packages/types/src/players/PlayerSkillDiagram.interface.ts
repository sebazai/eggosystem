/**
 * Player skill diagram interface representing a player's complete skill profile
 * Contains scores for 5 main skill categories and an overall rating
 */
export interface PlayerSkillDiagram {
  /** Steam ID of the player, or "aggregate" for multi-player aggregates */
  steam_id: string;

  /** Player nickname or descriptive name for aggregated data */
  nickname: string;

  /** Overall player rating (0-100 scale) */
  overall_rating: number;

  /** Aim skill score (0-100) - measures mechanical skills */
  aim: number;

  /** Positioning score (0-100) - measures tactical awareness */
  positioning: number;

  /** Impact score (0-100) - measures influence on round outcomes */
  impact: number;

  /** Utility score (0-100) - measures grenade and flash effectiveness */
  utility: number;

  /** Consistency score (0-100) - measures performance stability across maps and sides */
  consistency: number;

  /** Detailed metrics used to calculate the skill scores */
  detailed_metrics: {
    // Aim metrics
    hs_percent: number;
    kd: number;
    adr: number;
    ttd: number;
    counter_strafing: number;
    crosshair_placement: number;
    accuracy: number;

    // Positioning metrics
    first_kill_death_ratio: number;
    first_death_trade_percentage: number;
    trade_opportunities_converted: number;
    first_death_trade_attempts_ratio: number;
    first_death_traded_ratio: number;
    good_deaths_percentage: number;
    tradeable_first_deaths_percentage: number;
    traded_deaths_success_percentage: number;
    traded_death_attempts_percentage: number;
    trade_kill_opportunities_per_round: number;
    trade_kill_success_percentage: number;
    trade_kill_attempts_percentage: number;
    trade_death_opportunities_per_round: number;
    t_opening_duel_success_percentage: number;
    ct_opening_duel_success_percentage: number;

    // Impact metrics
    kast: number;
    clutches_won_percentage: number;
    multikills: number;
    kana_rating: number;
    one_v_one_win_ratio: number;
    first_kills_per_round: number;
    first_kill_success_ratio: number;
    trades_per_round: number;

    // Utility metrics
    flash_assists: number;
    enemies_flashed: number;
    enemies_flashed_duration: number;
    utility_damage: number;
    he_damage_per_round: number;
    molotov_damage_per_round: number;
    teammates_flashed_inverse: number;
    flash_assists_per_flash: number;
    enemies_flashed_per_flash: number;
    teammates_flashed_per_flash: number;

    // Consistency metrics
    ct_t_balance: number;
    map_consistency: number;
    clutch_vs_entry_balance: number;
    trade_death_ratio: number;

    // Side-specific performance metrics
    adr_t: number;
    adr_ct: number;
    kd_t: number;
    kd_ct: number;

    // Map variance metrics
    kills_variance: number;
    deaths_variance: number;
    adr_variance: number;

    // Side-specific consistency metrics
    first_kill_death_ratio_t: number;
    first_kill_death_ratio_ct: number;
  };
}
