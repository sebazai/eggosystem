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
  approved_at: string;
  ticket_id: string;
  details: string;
}
