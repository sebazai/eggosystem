export interface FlaggedMatches {
  external_match_id: string;
  steam_ids?: string[];
  players_in_season_team_players?: string[];
  team_id: number;
  match_ids?: number[];
  players_added_for_this_match?: string[];
}
