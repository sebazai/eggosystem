import type { KanahautomoRegistration } from "./KanahautomoRegistration.interface";

/**
 * Creates a mock KanahautomoRegistration object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial KanahautomoRegistration object to override defaults
 * @returns Complete KanahautomoRegistration object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const registration = createMockKanahautomoRegistration();
 *
 * // Override specific fields
 * const customRegistration = createMockKanahautomoRegistration({
 *   steam_id: "76561198012345678",
 *   organization_id: 1,
 *   accepted_terms: true
 * });
 * ```
 */
export const createMockKanahautomoRegistration = (
  overrides?: Partial<KanahautomoRegistration>
): KanahautomoRegistration => {
  const now = new Date().toISOString();
  return {
    id: 1,
    steam_id: "76561198012345678",
    organization_id: 1,
    accepted_terms: false,
    created_at: now,
    ...overrides
  };
};
