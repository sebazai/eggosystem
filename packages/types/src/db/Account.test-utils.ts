import type { Account } from "./Account.interface";

/**
 * Creates a mock Account object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial Account object to override defaults
 * @returns Complete Account object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const account = createMockAccount();
 *
 * // Override specific fields
 * const customAccount = createMockAccount({
 *   id: 123,
 *   steam_id: "76561198012345678",
 *   nickname: "TestUser"
 * });
 * ```
 */
export const createMockAccount = (overrides?: Partial<Account>): Account => {
  const now = new Date().toISOString();
  return {
    id: 1,
    steam_id: "76561198012345678",
    nickname: "Test User",
    full_name: null,
    work_email: null,
    work_email_verified: false,
    work_email_token: null,
    work_email_token_expires_at: null,
    is_work_email_personal_email: false,
    created_at: now,
    updated_at: now,
    ...overrides
  };
};
