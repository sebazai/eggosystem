import type { Nullable } from "@eggosystem/types";

export interface Account {
  id: number;
  steam_id: string;
  nickname: string;
  full_name: Nullable<string>;
  work_email: Nullable<string>;
  work_email_verified: boolean;
  work_email_token: Nullable<string>;
  work_email_token_expires_at: Nullable<string>;
  is_work_email_personal_email: boolean;
  created_at: string;
  updated_at: string;
}
