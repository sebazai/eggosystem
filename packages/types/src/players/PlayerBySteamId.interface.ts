import { Player } from "../db";
import type { Nullable } from "../utils";

export interface PlayerDetailsBySteamId {
  steam_id: Player["steam_id"];
  nickname: Player["nickname"];
  discord: Nullable<string>;
  work_email: Nullable<string>;
  is_valid_full_name: boolean;
  is_valid_work_email: boolean;
  has_accepted_latest_privacy_policy: boolean;
}
