import type { Nullable } from "../utils";

export interface PlayerBySteamId {
  steam_id: number;
  name: string;
  discord: Nullable<string>;
  work_email: Nullable<string>;
  is_valid_full_name: boolean;
}
