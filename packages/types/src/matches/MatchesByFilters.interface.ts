import type {
  Match,
  SeasonLeague,
  Map,
  Team,
  TeamMapScore,
  MatchMapPlayed
} from "../index";

export interface MatchesByFilters {
  match_played_id: MatchMapPlayed["id"];
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
