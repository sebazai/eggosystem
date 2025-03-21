import type { Nullable } from "@eggosystem/types";

export interface Player {
  steam_id: string;
  name: string;
  email?: Nullable<string>;
  player_name?: Nullable<string>;
  work_email?: Nullable<string>;
  discord?: Nullable<string>;
}
