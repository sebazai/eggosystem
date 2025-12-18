import type { Nullable, Team, Season, League } from "@eggosystem/types";

/**
 * Season Results - Season-based list of top 3 teams per division
 */

export interface SeasonResultsTeam {
  team_id: Team["id"];
  team_name: Team["name"];
  team_logo: Nullable<Team["team_logo"]>;
  placement: number;
}

export interface SeasonResultsDivision {
  league_id: League["id"];
  league_name: League["name"];
  teams: SeasonResultsTeam[];
}

export interface SeasonResultsResponse {
  season_id: Season["id"];
  season_name: Season["full_name"];
  divisions: SeasonResultsDivision[];
}

export interface SeasonResultsSeasonOption {
  season_id: Season["id"];
  season_name: Season["full_name"];
}

/**
 * Internal row type for database query results
 */
export interface SeasonResultsWinnerRow {
  team_id: number;
  team_name: string;
  team_logo: string | null;
  placement: number;
  league_id: number;
  league_name: string;
}
