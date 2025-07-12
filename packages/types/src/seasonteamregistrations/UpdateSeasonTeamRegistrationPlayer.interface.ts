import type { SteamPlayer } from "../db";

export interface UpdateSeasonTeamRegistrationPlayer {
  steam_id: SteamPlayer["steam_id"];
  is_captain: boolean;
  is_co_captain: boolean;
}
