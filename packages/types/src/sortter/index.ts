/**
 * Interface for team values used in the sortter functionality
 * Contains the team information and calculated values for team sorting
 */
export interface TeamSortterValues {
  team_id: number;
  team_name: string;
  team_logo: string;
  league_name: string;
  /** Sum of kanaelo for top 5 players */
  top5_sum: number;
  /** Average of kanaelo for top N players (configurable via TOP_N_FOR_COMPARISON) */
  avg5: number;
  /** Average of original/offered kanaelo for top N players (before stabilization) */
  orig5: number | null;
  /** Kanaelo values for top 5 players as an array */
  top5_values: number[];
  /** Original/offered kanaelo values for top 5 players as an array (before stabilization) */
  top5_offered_values?: (number | null)[];
  comments?: string;
  /** Flag indicating if the team has been flagged for ELO adjustments */
  is_flagged: boolean;
}

/**
 * Interface for raw database results before parsing
 */
export interface TeamSortterValuesRaw extends Omit<
  TeamSortterValues,
  "top5_values" | "top5_offered_values"
> {
  top5_values: string;
  top5_offered_values?: string;
}

/**
 * Interface for team placement data stored in Redis
 */
export interface TeamPlacement {
  team_id: number;
  team_name: string;
  division: number;
  comments: string;
  original_avg: number;
  original_position: number;
}

/**
 * Interface for player values used in the sortter functionality
 * Contains player statistics and ranking information
 * Values can be null from the database
 */
import { SeasonPlayerRank } from "../db";

export interface PlayerSortterValues {
  name: string;
  steamid: string;
  cs2_rank: SeasonPlayerRank["cs2_rank"];
  faceit_level: SeasonPlayerRank["faceit_level"];
  faceit_elo: SeasonPlayerRank["faceit_elo"];
  hours: SeasonPlayerRank["cs_hours"] | null;
  kanarating: number | null;
  fkd: number | null;
  kana_elo: SeasonPlayerRank["kana_elo"];
  offered_elo?: number | null;
  calculus: string | null;
}

/**
 * Interface for season information used in sortter
 */
export interface SortterSeason {
  id: number;
  name: string;
}

/**
 * Historical performance of a team from a previous season
 * Used to track teams with similar core rosters across seasons
 */
export interface TeamHistoricalPerformance {
  matched_team_id: number;
  matched_team_name: string;
  season_id: number;
  season_name: string;
  league_id: number;
  league_name: string;
  wins: number;
  losses: number;
  avg_rounds_won: number;
  avg_rounds_lost: number;
  matching_players: number;
}
