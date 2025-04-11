interface TopTeamsForLeague {
  team_id: number;
  team_name: string;
  team_logo?: string;
  matches_played: number;
  kana: number;
  rank: number;
}

export interface TopTeamsByFilters {
  league_id: number;
  league_name: string;
  league_sort_priority: number;
  stage: number;
  teams: TopTeamsForLeague[];
}

export interface TopTeamsByFiltersRaw extends Omit<TopTeamsByFilters, "teams"> {
  teams: string;
}
