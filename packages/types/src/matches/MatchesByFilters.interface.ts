import type { Match, SeasonLeague, Map, Team, TeamMapScore } from "../index";

export interface MatchesByFilters {
  match_date: Match["match_date"];
  stage: Match["stage"];
  league_name: SeasonLeague["name"];
  map_name: Map["name"];
  team_1_name: Team["name"];
  team_2_name: Team["name"];
  team_1_logo: Team["team_logo"];
  team_2_logo: Team["team_logo"];
  team_1_map_end_score: TeamMapScore["score"];
  team_2_map_end_score: TeamMapScore["score"];
}
