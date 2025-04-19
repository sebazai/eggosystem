export interface PlayerStatsTable {
  steam_id: string;
  nickname: string;
  team_name: string; // Team name only, not logo
  matches_played: number;
  kills: number;
  deaths: number;
  assists: number;
  flash_assists: number;
  awp_kills: number;
  utility_damage: number;
  headshots: number;
  first_kills: number;
  first_deaths: number;
  adr: number;
  kana_rating: number;
  hs_percent: number;
  kd: number;
}
