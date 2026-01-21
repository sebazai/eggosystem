import { Account } from "./Account.interface";
import { Permission } from "./Permission.interface";
import { Season } from "./Season.interface";
import { Team } from "./Team.interface";

export interface AccountPermissionScopes {
  account_id: Account["id"];
  permission_id: Permission["id"];
  season_id: Season["id"];
  team_id: Team["id"];
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
