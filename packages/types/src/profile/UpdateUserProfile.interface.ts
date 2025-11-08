import { Nullable } from "../utils";

export interface UpdateUserProfile {
  nickname: string;
  full_name: string;
  work_email: Nullable<string>;
  work_email_token: Nullable<string>;
  work_email_token_expires_at: Nullable<Date>;
  work_email_verified: boolean;
  is_work_email_personal_email: boolean;
}
