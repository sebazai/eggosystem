export interface SeasonTeam {
  season_id: number;
  team_id: number;
  captain_steam_id?: string | null; // BIGINT stored as string to prevent precision loss
  defects?: string | null; // TEXT can be nullable
  co_captain_steam_id?: string | null;
  ticket?: string | null;
  approved: boolean;
  notification_sent: boolean;
}
