import { Nullable } from "../utils";

export interface UpdateUserProfile {
  nickname: string;
  full_name: string;
  work_email: string;
  discord: Nullable<string>;
}
