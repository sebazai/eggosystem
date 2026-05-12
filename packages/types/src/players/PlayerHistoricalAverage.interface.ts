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
  /** Number of last games to include (default: 15) */
  games?: number;

  /** Season period filter */
  period?: "this_season" | "last_season";

  /** Steam app_id (required when period is set) */
  app_id?: number;

  /** Internal organizer id (required when period is set) */
  organizer_id?: number;
}
