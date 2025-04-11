import type { Nullable } from "@eggosystem/types";

export interface Player {
  steam_id: string;
  nickname: string;
  email?: Nullable<string>;
  full_name?: Nullable<string>;
  work_email?: Nullable<string>;
  discord?: Nullable<string>;
}
