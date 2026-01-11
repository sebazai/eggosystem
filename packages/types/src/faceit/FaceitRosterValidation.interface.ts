export interface FaceitPlayer {
  steam_id: string;
  nickname: string;
  faceit_user_id: string;
}

export interface HubPlayer {
  steam_id: string;
  nickname: string;
  role?: "primary" | "substitute";
}

export interface MatchingPlayer {
  steam_id: string;
  nickname: string;
  faceit_nickname?: string;
  role?: "primary" | "substitute";
}

export interface FaceitTeamRosterComparison {
  team_id: number;
  team_name: string;
  faceit_team_id: string | null;
  faceit_team_url: string | null;
  championship_id?: string;
  has_mismatches: boolean;
  players_in_faceit_not_in_hub: FaceitPlayer[];
  players_in_hub_not_in_faceit: HubPlayer[];
  matching_players: MatchingPlayer[];
}

export interface ChampionshipValidationResult {
  championship_id: string;
  championship_name: string;
  stage_id: number;
  stage_name: string;
  teams: FaceitTeamRosterComparison[];
  summary: {
    total_teams: number;
    teams_with_issues: number;
    total_rule_violations: number;
    total_unplayable_players: number;
  };
}

export interface SeasonFaceitRosterValidation {
  season_id: number;
  season_name: string;
  championships: ChampionshipValidationResult[];
  summary?: {
    total_teams: number;
    teams_with_issues: number;
    total_rule_violations: number;
    total_unplayable_players: number;
  };
}
