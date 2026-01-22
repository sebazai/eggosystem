import { Match, Season, League, Team, TeamGameScore } from "../db";

/**
 * Match history item for player/team match history display
 * Uses indexed access types for direct database fields
 */
export interface MatchHistoryItem {
  match_id: Match["id"];
  date: string; // Computed from DATE(start_timestamp) in queries
  season_name: Season["name"];
  league_name: League["name"];
  opponent_name: Team["name"];
  opponent_logo: Team["team_logo"];
  maps: string; // Calculated field - concatenated map names
  team_score: TeamGameScore["score"]; // Calculated field - aggregated from match games
  opponent_score: TeamGameScore["score"]; // Calculated field - aggregated from match games
  result: "win" | "loss" | "draw"; // Calculated field - match result
}
