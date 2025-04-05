import { Nullable } from "../utils";

export interface UpdateUserProfile {
  name: string;
  player_name: string;
  work_email: string;
  discord: Nullable<string>;
}
