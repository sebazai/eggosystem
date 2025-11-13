import { Account } from "./Account.interface";

export interface UserPolicyAcceptance {
  id: number;
  account_id: Account["id"];
  accepted_privacy_policy: boolean;
  accepted_marketing: boolean;
  accepted_newsletter: boolean;
  created_at: Date;
  updated_at: Date;
  privacy_policy_version: string;
}
