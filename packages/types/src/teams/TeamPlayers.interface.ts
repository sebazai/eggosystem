import { SeasonTeamPlayer, SteamPlayer } from "../db";

export interface TeamPlayers {
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  is_captain: SeasonTeamPlayer["is_captain"];
  is_co_captain: SeasonTeamPlayer["is_co_captain"];
  faceit_nickname: SteamPlayer["faceit_nickname"];
}
