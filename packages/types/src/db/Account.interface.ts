import type { Nullable } from "@eggosystem/types";

export interface Account {
  id: number;
  full_name?: Nullable<string>;
  work_email?: Nullable<string>;
  work_email_token?: Nullable<string>;
  work_email_verified: boolean;
  work_email_token_expires_at?: Nullable<string>;
  discord?: Nullable<string>;
  is_work_email_personal_email: boolean;
  updated_at: string;
  created_at: string;
}
