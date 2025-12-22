import type { CasterUrl } from "./CasterUrl.interface";

/**
 * Creates a mock CasterUrl object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial CasterUrl object to override defaults
 * @returns Complete CasterUrl object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const casterUrl = createMockCasterUrl();
 *
 * // Override specific fields
 * const customCasterUrl = createMockCasterUrl({
 *   account_id: 123,
 *   stream_url: "https://twitch.tv/test",
 *   is_default: true
 * });
 * ```
 */
export const createMockCasterUrl = (
  overrides?: Partial<CasterUrl>
): CasterUrl => {
  const now = new Date().toISOString();
  return {
    id: 1,
    account_id: 1,
    stream_url: "https://example.com/stream",
    is_default: false,
    created_at: now,
    updated_at: now,
    ...overrides
  };
};
