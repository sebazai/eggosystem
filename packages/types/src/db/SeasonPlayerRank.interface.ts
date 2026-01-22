import type { SteamPlayer, Season, Nullable } from "@eggosystem/types";

export interface SeasonPlayerRank {
  id: number;
  steam_id: SteamPlayer["steam_id"]; // Updated to string for steam_id
  season_id: Season["id"];
  /**
   * Rank update timestamp in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  rank_updated_at: string | null;
  /**
   * Hours update timestamp in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  hours_updated_at: string;
  csgo_rank: Nullable<number>; // Default -1 if not provided
  cs2_rank: number | null; // Can be null
  cs_hours: number | null; // Default -1 if not provided
  faceit_level: number | null; // Can be null
  faceit_elo: number; // Default 800 if not provided
  faceit_kd: number | null; // DECIMAL(3,2), can be null
  /**
   * Faceit data update timestamp in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  faceit_date: string | null;
  kana_elo: number; // Default 0 if not provided
  esportal_kd: number | null; // DECIMAL(4,2), can be null
  esportal_elo: number | null; // Can be null
  esportal_rank: number | null; // Can be null
}
