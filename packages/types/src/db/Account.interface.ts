import type { Nullable } from "@eggosystem/types";

export interface Account {
  id: number;
  email?: Nullable<string>;
  full_name?: Nullable<string>;
  work_email?: Nullable<string>;
  discord?: Nullable<string>;
  updated_at: string;
  created_at: string;
}
