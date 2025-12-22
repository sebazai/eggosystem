import type { UserPayload } from "./index";

/**
 * Creates a mock UserPayload object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial UserPayload object to override defaults
 * @returns Complete UserPayload object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const userPayload = createMockUserPayload();
 *
 * // Override specific fields
 * const customUserPayload = createMockUserPayload({
 *   account_id: 123,
 *   provider_id: "76561198012345678",
 *   nickname: "TestUser"
 * });
 * ```
 */
export const createMockUserPayload = (
  overrides?: Partial<UserPayload>
): UserPayload => {
  return {
    account_id: 1,
    provider_id: "76561198012345678",
    permissions: [],
    roles: [],
    nickname: "Test User",
    provider: "steam",
    ...overrides
  };
};
