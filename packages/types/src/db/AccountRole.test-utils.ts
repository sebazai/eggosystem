import type { AccountRole } from "./AccountRole.interface";

/**
 * Creates a mock AccountRole object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial AccountRole object to override defaults
 * @returns Complete AccountRole object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const accountRole = createMockAccountRole();
 *
 * // Override specific fields
 * const customAccountRole = createMockAccountRole({
 *   account_id: 123,
 *   role_id: 1,
 *   game_id: 730
 * });
 * ```
 */
export const createMockAccountRole = (
  overrides?: Partial<AccountRole>
): AccountRole => {
  const now = new Date().toISOString();
  return {
    account_id: 1,
    role_id: 1,
    game_id: 730,
    created_at: now,
    updated_at: now,
    ...overrides
  };
};
