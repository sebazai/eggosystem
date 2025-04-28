import { Nullable } from "../utils";

export interface UpdateUserProfile {
  nickname: string;
  full_name: string;
  work_email: Nullable<string>;
  work_email_token: Nullable<string>;
  work_email_token_expires_at: Nullable<Date>;
  email: Nullable<string>;
  email_token: Nullable<string>;
  email_token_expires_at: Nullable<Date>;
  discord: Nullable<string>;
}
