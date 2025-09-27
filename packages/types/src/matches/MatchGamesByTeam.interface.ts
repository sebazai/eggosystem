import { Match, Team, Map, MatchGame, TeamGameScore } from "../db";

export interface MatchGamesByTeam {
  match_id: Match["id"];
  team1_id: Team["id"];
  team2_id: Team["id"];
  team1_name: Team["name"];
  team2_name: Team["name"];
  match_date: string; // YYYY-MM-DD
  league_id: Match["league_id"];
  season_id: Match["season_id"];
  match_game_id: MatchGame["id"];
  map_name: Map["name"];
  map_id: Map["id"];
  map_order: MatchGame["map_order"];
  team1_score: TeamGameScore["score"];
  team2_score: TeamGameScore["score"];
}
