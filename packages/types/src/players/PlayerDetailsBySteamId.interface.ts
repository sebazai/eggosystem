import { Account, SteamPlayer, LinkedAccount } from "../db";

export interface PlayerDetailsBySteamId {
  account_id: Account["id"];
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  discord: LinkedAccount["provider_username"];
  work_email_verified: Account["work_email_verified"];
  is_valid_full_name: number;
  is_valid_work_email: number;
}
