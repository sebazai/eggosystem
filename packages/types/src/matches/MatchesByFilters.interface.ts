import type {
  Match,
  League,
  Team,
  TeamGameScore,
  Nullable,
  MatchGame
} from "../index";
import type { MatchTeamSide } from "./MatchTeamSide.types";

export interface MatchMapScore {
  name: string;
  score_a: number;
  score_b: number;
}

export interface MatchesByFilters {
  match_id: Match["id"];
  match_game_id: Nullable<MatchGame["id"]>;
  match_group: Match["group"] | null;
  match_round: Match["round"] | null;
  best_of: Match["best_of"];
  season_id: Match["season_id"];
  match_date: string;
  start_timestamp: string;
  end_timestamp: string | null;
  stage: Match["stage"];
  league_name: League["name"];
  maps_json: MatchMapScore[];
  team1_name: Team["name"];
  team2_name: Team["name"];
  team1_logo: Team["team_logo"];
  team2_logo: Team["team_logo"];
  team1_score: TeamGameScore["score"];
  team2_score: TeamGameScore["score"];
  team1_side: MatchTeamSide;
  team2_side: MatchTeamSide;
}
