/**
 * Interface for player historical average data response
 * Contains averaged statistics for comparison data in charts
 */
export interface PlayerHistoricalAverage {
  /** Average Kana rating */
  avg_kana_rating: number;

  /** Average Kill/Death ratio */
  avg_kd_ratio: number;

  /** Average Damage per Round */
  avg_adr: number;

  /** Average Time to damage (in seconds) */
  avg_ttd: number | null;

  /** Average Crosshair placement percentage */
  avg_crosshair_placement: number | null;

  /** Average Counter-strafing success percentage */
  avg_counter_strafing_percent: number | null;

  /** Average Headshot percentage */
  avg_hs_percent: number;
}

/**
 * Query parameters for filtering historical data
 */
export interface HistoricalDataParams {
  /** Number of last games to include */
  games?: number;

  /** Filter to a specific season */
  season_id?: number;
}
