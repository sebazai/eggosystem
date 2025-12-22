import type { Role } from "./Role.interface";

/**
 * Creates a mock Role object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial Role object to override defaults
 * @returns Complete Role object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const role = createMockRole();
 *
 * // Override specific fields
 * const customRole = createMockRole({
 *   id: 1,
 *   role_name: "admin"
 * });
 * ```
 */
export const createMockRole = (overrides?: Partial<Role>): Role => {
  const now = new Date().toISOString();
  return {
    id: 1,
    role_name: "user",
    created_at: now,
    updated_at: now,
    ...overrides
  };
};
