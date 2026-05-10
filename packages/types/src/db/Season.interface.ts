import {
  Nullable,
  type Game,
  type SeasonPlatform,
  GameType,
  Organizer
} from "@eggosystem/types";

export interface Season {
  id: number;
  game_id: Game["id"];
  game_type_id: GameType["id"];
  organizer_id: Organizer["id"];
  name: string;
  full_name: string;
  /**
   * Signup start date in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  signup_start_date: string | null;
  /**
   * Signup end date in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  signup_end_date: string | null;
  platform: SeasonPlatform;
  /**
   * Start date as DATE (YYYY-MM-DD format)
   */
  start_date: string;
  /**
   * End date as DATE (YYYY-MM-DD format) or null
   */
  end_date: string | null;
  is_round_robin_bo2_as_2xbo1: boolean;
  grand_final_round_one_only: boolean;
  payment_link: string | null;
  registration_price: number | null;
  has_vat: boolean;
  early_bird_price_discount: number | null;
  /**
   * Early bird discount end date in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  early_bird_price_discount_end_date: string | null;
  /**
   * Active map pool - array of map IDs that are active for this season
   * Must contain at least one map ID
   */
  active_map_pool: number[];
  /**
   * Rulebook URL for the season (nullable)
   */
  rulebook_url: string | null;
  /**
   * Discord link for the season (nullable)
   */
  discord_link: string | null;
  faceit_rank_required: boolean;
  premier_rank_required: boolean;
  hours_played_required: boolean;
}

export interface InsertSeason {
  id: number;
  game_id: Game["id"];
  game_type_id: GameType["id"];
  organizer_id: Organizer["id"];
  name: string;
  full_name: string;
  signup_start_date: Nullable<Date>;
  signup_end_date: Nullable<Date>;
  platform: SeasonPlatform;
  start_date: Date; // DATE stored as string (ISO format)
  end_date: Nullable<Date>;
  is_round_robin_bo2_as_2xbo1?: boolean;
  payment_link?: Nullable<string>;
  registration_price?: Nullable<number>;
  has_vat?: boolean;
  early_bird_price_discount?: Nullable<number>;
  early_bird_price_discount_end_date?: Nullable<Date>;
  rulebook_url?: Nullable<string>;
  discord_link?: Nullable<string>;
  faceit_rank_required?: boolean;
  premier_rank_required?: boolean;
  hours_played_required?: boolean;
}
