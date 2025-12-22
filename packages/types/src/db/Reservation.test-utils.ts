import type { Reservation } from "./Reservation.interface";

/**
 * Creates a mock Reservation object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial Reservation object to override defaults
 * @returns Complete Reservation object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const reservation = createMockReservation();
 *
 * // Override specific fields
 * const customReservation = createMockReservation({
 *   match_id: 123,
 *   account_id: 456
 * });
 * ```
 */
export const createMockReservation = (
  overrides?: Partial<Reservation>
): Reservation => {
  return {
    id: 1,
    stream_url: "https://example.com/stream",
    hash: "test-hash",
    match_id: 1,
    account_id: undefined,
    ...overrides
  };
};
