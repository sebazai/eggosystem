import { SteamPlayer } from "./SteamPlayer.interface";

export interface SteamPlayerKanaElo {
  id: number;
  steam_id: SteamPlayer["steam_id"];
  kana_elo: number;
}
