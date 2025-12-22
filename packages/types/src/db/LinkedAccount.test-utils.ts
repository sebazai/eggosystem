import type { LinkedAccount } from "./LinkedAccount.interface";

/**
 * Creates a mock LinkedAccount object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial LinkedAccount object to override defaults
 * @returns Complete LinkedAccount object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const linkedAccount = createMockLinkedAccount();
 *
 * // Override specific fields
 * const customLinkedAccount = createMockLinkedAccount({
 *   account_id: 123,
 *   provider: "discord",
 *   provider_id: "123456789"
 * });
 * ```
 */
export const createMockLinkedAccount = (
  overrides?: Partial<LinkedAccount>
): LinkedAccount => {
  return {
    account_id: 1,
    provider: "steam",
    provider_id: "76561198012345678",
    provider_username: null,
    ...overrides
  };
};
