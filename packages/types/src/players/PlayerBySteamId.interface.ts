import { Account, SteamPlayer } from "../db";

export interface PlayerDetailsBySteamId {
  account_id: Account["id"];
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  discord: Account["discord"];
  is_valid_full_name: boolean;
  is_valid_work_email: boolean;
  has_accepted_latest_privacy_policy: boolean;
}
