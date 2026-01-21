import type { Nullable } from "@eggosystem/types";

export interface Account {
  id: number;
  steam_id: string;
  nickname: string;
  full_name: Nullable<string>;
  work_email: Nullable<string>;
  work_email_verified: boolean;
  work_email_token: Nullable<string>;
  /**
   * Work email token expiration timestamp in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  work_email_token_expires_at: Nullable<string>;
  is_work_email_personal_email: boolean;
  /**
   * Account creation timestamp in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  created_at: string;
  /**
   * Account last update timestamp in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  updated_at: string;
}
