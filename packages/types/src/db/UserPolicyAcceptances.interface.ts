export interface UserPolicyAcceptance {
  id: number;
  steam_id: string;
  accepted_privacy_policy: boolean;
  accepted_marketing: boolean;
  created_at: Date;
  updated_at: Date;
  privacy_policy_version: string;
}
