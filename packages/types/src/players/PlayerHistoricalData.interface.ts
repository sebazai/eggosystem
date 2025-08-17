/**
 * Interface for player historical data response
 * Contains aggregated statistics for each match date, ordered by latest date first
 */
export interface PlayerHistoricalData {
  /** Match ID for linking to specific match */
  match_id: number;

  /** Game ID for linking to specific game within match */
  game_id: number;

  /** Match date in YYYY-MM-DD format */
  match_date: string;

  /** Player's Kana rating for this match */
  kana_rating: number;

  /** Kill/Death ratio (calculated from kills/deaths) */
  kd_ratio: number;

  /** Average Damage per Round */
  adr: number;

  /** Time to damage (in seconds) */
  ttd: number | null;

  /** Crosshair placement percentage */
  crosshair_placement: number | null;

  /** Counter-strafing success percentage (good_strafing_shots/total_strafing_shots * 100) */
  counter_strafing_percent: number | null;

  /** Headshot percentage */
  hs_percent: number;
}
