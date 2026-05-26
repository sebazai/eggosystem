import type {
  Match,
  League,
  Team,
  TeamGameScore,
  Nullable,
  MatchGame
} from "../index";

export interface MatchesByFiltersTeam {
  name: Team["name"];
  logo: Team["team_logo"];
  score: TeamGameScore["score"];
}

export interface MatchMapScore {
  name: string;
  home_score: number;
  away_score: number;
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
  home_team: MatchesByFiltersTeam;
  away_team: MatchesByFiltersTeam;
}
