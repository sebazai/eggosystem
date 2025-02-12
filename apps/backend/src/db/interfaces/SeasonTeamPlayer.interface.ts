export interface SeasonTeamPlayer {
  season_id: number;
  team_id: number;
  steam_id: string; // BIGINT stored as string to prevent precision loss
  role: 'primary' | 'substitute';
}
