import type { FaceitWebhook } from "./FaceitWebhook.interface";

/**
 * Creates a mock FaceitWebhook object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial FaceitWebhook object to override defaults
 * @returns Complete FaceitWebhook object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const webhook = createMockFaceitWebhook();
 *
 * // Override specific fields
 * const customWebhook = createMockFaceitWebhook({
 *   external_payload_id: "abc123",
 *   event: "match_status_ready",
 *   data: "{\"match_id\": \"123\"}"
 * });
 * ```
 */
export const createMockFaceitWebhook = (
  overrides?: Partial<FaceitWebhook>
): FaceitWebhook => {
  const now = new Date().toISOString();
  return {
    id: 1,
    received_at: now,
    external_payload_id: "test-payload-id",
    event: "match_created",
    data: "{}",
    details: "{}",
    error_type: null,
    error_details: null,
    ...overrides
  };
};
