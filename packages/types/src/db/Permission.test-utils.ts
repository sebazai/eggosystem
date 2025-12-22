import type { Permission } from "./Permission.interface";

/**
 * Creates a mock Permission object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial Permission object to override defaults
 * @returns Complete Permission object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const permission = createMockPermission();
 *
 * // Override specific fields
 * const customPermission = createMockPermission({
 *   id: 1,
 *   permission_name: "admin:read"
 * });
 * ```
 */
export const createMockPermission = (
  overrides?: Partial<Permission>
): Permission => {
  const now = new Date().toISOString();
  return {
    id: 1,
    permission_name: "test:read",
    created_at: now,
    updated_at: now,
    ...overrides
  };
};
