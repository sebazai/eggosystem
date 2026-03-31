export interface FlaggedMatches {
  external_match_id: string;
  steam_ids?: string[];
  players_in_season_team_players?: string[];
  team_id: number;
  /** Display name from Teams.name when the flag was recorded (optional for older Redis entries). */
  team_name?: string;
  match_ids?: number[];
  players_added_for_this_match?: string[];
}
