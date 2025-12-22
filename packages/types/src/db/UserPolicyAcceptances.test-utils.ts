import type { UserPolicyAcceptance } from "./UserPolicyAcceptances.interface";

/**
 * Creates a mock UserPolicyAcceptance object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial UserPolicyAcceptance object to override defaults
 * @returns Complete UserPolicyAcceptance object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const policyAcceptance = createMockUserPolicyAcceptance();
 *
 * // Override specific fields
 * const customPolicyAcceptance = createMockUserPolicyAcceptance({
 *   account_id: 123,
 *   accepted_privacy_policy: true,
 *   privacy_policy_version: "2.0"
 * });
 * ```
 */
export const createMockUserPolicyAcceptance = (
  overrides?: Partial<UserPolicyAcceptance>
): UserPolicyAcceptance => {
  const now = new Date();
  return {
    id: 1,
    account_id: 1,
    accepted_privacy_policy: false,
    accepted_marketing: false,
    accepted_tournament_newsletter: false,
    created_at: now,
    updated_at: now,
    privacy_policy_version: "1.0",
    ...overrides
  };
};
