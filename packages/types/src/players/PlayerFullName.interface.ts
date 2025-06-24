import { Account, SteamPlayer } from "../db";

export interface PlayerFullName {
  steam_id: SteamPlayer["steam_id"];
  full_name: Account["full_name"];
}
