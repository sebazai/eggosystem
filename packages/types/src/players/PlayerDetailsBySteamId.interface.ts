import { Account, SteamPlayer } from "../db";

export interface PlayerDetailsBySteamId {
  account_id: Account["id"];
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  discord_linked: number; // MySQL returns TRUE/FALSE as 1/0
  work_email_verified: Account["work_email_verified"];
  is_valid_full_name: number;
  is_valid_work_email: number;
}
