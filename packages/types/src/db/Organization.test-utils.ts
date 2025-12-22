import type { Organizations } from "./Organization.interface";

/**
 * Creates a mock Organizations object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial Organizations object to override defaults
 * @returns Complete Organizations object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const organization = createMockOrganization();
 *
 * // Override specific fields
 * const customOrganization = createMockOrganization({
 *   id: 123,
 *   name: "Test Organization",
 *   organization_code: "TEST"
 * });
 * ```
 */
export const createMockOrganization = (
  overrides?: Partial<Organizations>
): Organizations => {
  return {
    id: 1,
    name: "Test Organization",
    logo: "test-logo-id",
    organization_code: "TEST",
    website: "https://example.com",
    country: "FI",
    sort_order: null,
    discord_invite_link: null,
    ...overrides
  };
};
