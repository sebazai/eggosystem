import type { RolePermission } from "./RolePermission.interface";

/**
 * Creates a mock RolePermission object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial RolePermission object to override defaults
 * @returns Complete RolePermission object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const rolePermission = createMockRolePermission();
 *
 * // Override specific fields
 * const customRolePermission = createMockRolePermission({
 *   role_id: 1,
 *   permission_id: 2
 * });
 * ```
 */
export const createMockRolePermission = (
  overrides?: Partial<RolePermission>
): RolePermission => {
  const now = new Date().toISOString();
  return {
    role_id: 1,
    permission_id: 1,
    created_at: now,
    updated_at: now,
    ...overrides
  };
};
