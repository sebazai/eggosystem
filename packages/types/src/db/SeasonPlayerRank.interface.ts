export interface SeasonPlayerRank {
  id: number;
  steam_id: string; // Updated to string for steam_id
  season_id: number;
  kukko_date: string | null; // TIMESTAMP, can be null
  csgo_rank: number; // Default -1 if not provided
  cs2_rank: number | null; // Can be null
  cs_hours: number; // Default -1 if not provided
  faceit_level: number | null; // Can be null
  faceit_elo: number; // Default 800 if not provided
  faceit_kd: number | null; // DECIMAL(3,2), can be null
  faceit_date: string | null; // TIMESTAMP, can be null
  kana_elo: number; // Default 0 if not provided
  esportal_kd: number | null; // DECIMAL(4,2), can be null
  esportal_elo: number | null; // Can be null
  esportal_rank: number | null; // Can be null
}
