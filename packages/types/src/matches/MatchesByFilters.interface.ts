import type {
  Match,
  League,
  Map,
  Team,
  TeamGameScore,
  Nullable,
  MatchGame
} from "../index";
import type { MatchTeamSide } from "./MatchTeamSide.types";

export interface MatchesByFilters {
  match_id: Match["id"];
  match_game_id: Nullable<MatchGame["id"]>;
  match_date: string; // Computed from DATE(start_timestamp) in queries
  stage: Match["stage"];
  league_name: League["name"];
  map_name: Map["name"];
  team1_name: Team["name"];
  team2_name: Team["name"];
  team1_logo: Team["team_logo"];
  team2_logo: Team["team_logo"];
  team1_score: TeamGameScore["score"];
  team2_score: TeamGameScore["score"];
  team1_side: MatchTeamSide;
  team2_side: MatchTeamSide;
}
