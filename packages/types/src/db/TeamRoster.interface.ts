import type { SteamPlayer, Team } from "@eggosystem/types";

export interface TeamRoster {
  id: number;
  team_id: Team["id"];
  steam_id: SteamPlayer["steam_id"];
}
