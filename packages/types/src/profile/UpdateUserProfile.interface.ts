import { Nullable } from "../utils";

export interface UpdateUserProfile {
  nickname: string;
  full_name: string;
  work_email: Nullable<string>;
  email: Nullable<string>;
  discord: Nullable<string>;
}
