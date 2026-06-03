import { Account } from "./Account.interface";

/**
 * Newsletter / marketing consent category.
 * Shared between the backend newsletter controllers/models and the
 * frontend newsletter admin UI.
 */
export type NewsletterConsentType = "newsletter" | "marketing" | "both";

export interface UserPolicyAcceptance {
  id: number;
  account_id: Account["id"];
  accepted_privacy_policy: boolean;
  accepted_marketing: boolean;
  accepted_tournament_newsletter: boolean;
  created_at: Date;
  updated_at: Date;
  privacy_policy_version: string;
  newsletter_unsubscribe_token: string | null;
}
