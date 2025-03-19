import type {
  Match,
  SeasonLeague,
  Map,
  Team,
  TeamMapScore,
  MatchGame
} from "../index";

export interface MatchesByFilters {
  game_id: MatchGame["id"];
  match_date: Match["match_date"];
  stage: Match["stage"];
  league_name: SeasonLeague["name"];
  map_name: Map["name"];
  team1_name: Team["name"];
  team2_name: Team["name"];
  team1_logo: Team["team_logo"];
  team2_logo: Team["team_logo"];
  team1_score: TeamMapScore["score"];
  team2_score: TeamMapScore["score"];
}
