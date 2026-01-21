import { Account } from "./Account.interface";
import { Game } from "./Game.interface";
import { Role } from "./Role.interface";

export interface AccountRole {
  account_id: Account["id"];
  role_id: Role["id"];
  game_id: Game["id"];
  /**
   * Creation timestamp in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  created_at: string;
  /**
   * Last update timestamp in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  updated_at: string;
}
