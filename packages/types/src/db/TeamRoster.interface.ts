import type { Player, Team } from "@eggosystem/types";

export interface TeamRoster {
  id: number;
  team_id: Team["id"];
  steam_id: Player["steam_id"];
}
