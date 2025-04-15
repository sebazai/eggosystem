import { Account, LinkedAccount, SteamPlayer } from "../db";

export interface AuthSteamUser {
  account_id: Account["id"];
  steam_id: SteamPlayer["steam_id"];
  provider: LinkedAccount["provider"];
  nickname: SteamPlayer["nickname"];
  full_name: Account["full_name"];
  email: Account["email"];
  work_email: Account["work_email"];
  discord: Account["discord"];
}
