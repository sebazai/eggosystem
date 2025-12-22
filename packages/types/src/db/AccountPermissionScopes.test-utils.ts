import type { AccountPermissionScopes } from "./AccountPermissionScopes.interface";

/**
 * Creates a mock AccountPermissionScopes object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial AccountPermissionScopes object to override defaults
 * @returns Complete AccountPermissionScopes object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const accountPermissionScope = createMockAccountPermissionScopes();
 *
 * // Override specific fields
 * const customAccountPermissionScope = createMockAccountPermissionScopes({
 *   account_id: 123,
 *   permission_id: 1,
 *   season_id: 14,
 *   team_id: 1650
 * });
 * ```
 */
export const createMockAccountPermissionScopes = (
  overrides?: Partial<AccountPermissionScopes>
): AccountPermissionScopes => {
  const now = new Date().toISOString();
  return {
    account_id: 1,
    permission_id: 1,
    season_id: 1,
    team_id: 1,
    created_at: now,
    updated_at: now,
    ...overrides
  };
};
