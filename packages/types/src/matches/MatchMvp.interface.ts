import type { SteamPlayer, Team } from "@eggosystem/types";

export interface MatchMvp {
  match_id: number;
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  avatar: SteamPlayer["avatar"];
  team_id: Team["id"];
  kana_rating: number;
}
