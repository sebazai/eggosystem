import type { Player } from "@eggosystem/types";

export interface UpsertPlayer {
  steam_id: Player["steam_id"];
  nickname?: Player["nickname"];
  discord?: Player["discord"];
  work_email?: Player["work_email"];
  full_name?: Player["full_name"];
}
