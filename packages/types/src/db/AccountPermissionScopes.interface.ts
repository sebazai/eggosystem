import { Account } from "./Account.interface";
import { Permission } from "./Permission.interface";
import { Season } from "./Season.interface";
import { Team } from "./Team.interface";

export interface AccountPermissionScopes {
  account_id: Account["id"];
  permission_id: Permission["id"];
  season_id: Season["id"];
  team_id: Team["id"];
  created_at: string;
  updated_at: string;
}
