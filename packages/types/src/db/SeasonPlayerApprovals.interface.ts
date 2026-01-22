import { SteamPlayer } from "./SteamPlayer.interface";
import { Season } from "./Season.interface";
import { Organizations } from "./Organization.interface";
import { Team } from "./Team.interface";
import { Account } from "./Account.interface";

export interface SeasonPlayerApprovals {
  id: number;
  steam_id: SteamPlayer["steam_id"];
  season_id: Season["id"];
  organization_id: Organizations["id"];
  team_id: Team["id"];
  approved_by_id: Account["id"];
  /**
   * Approval timestamp in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  approved_at: string;
  ticket_id: string;
  details: string;
}
