import type { Match, SeasonLeague, Map, Team, TeamMapScore } from "../index";

export interface MatchesByFilters {
  match_date: Match["match_date"];
  stage: Match["stage"];
  league_name: SeasonLeague["name"];
  map_name: Map["name"];
  team_name: Team["name"];
  opponent_name: Team["name"];
  team_logo: Team["team_logo"];
  opponent_logo: Team["team_logo"];
  team_score: TeamMapScore["score"];
  opponent_score: TeamMapScore["score"];
}
