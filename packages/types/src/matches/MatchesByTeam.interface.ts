import { Match, Team } from "../db";

export interface MatchesByTeam {
  id: Match["id"];
  team1_id: Team["id"];
  team2_id: Team["id"];
  team1_name: Team["name"];
  team2_name: Team["name"];
  team1_score: number;
  team2_score: number;
  match_date: string; // YYYY-MM-DD
  league_id: Match["league_id"];
  season_id: Match["season_id"];
}
