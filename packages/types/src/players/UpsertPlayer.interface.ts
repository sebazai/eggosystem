import type { Nullable, Player } from "@eggosystem/types";

export interface UpsertPlayer {
  steam_id: Player["steam_id"];
  name?: Nullable<Player["name"]>;
  discord?: Player["discord"];
  work_email?: Player["work_email"];
  player_name?: Player["player_name"];
}
