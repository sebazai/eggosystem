import type { SteamPlayerKanaElo } from "./SteamPlayerKanaElo.interface";

/**
 * Creates a mock SteamPlayerKanaElo object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial SteamPlayerKanaElo object to override defaults
 * @returns Complete SteamPlayerKanaElo object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const kanaElo = createMockSteamPlayerKanaElo();
 *
 * // Override specific fields
 * const customKanaElo = createMockSteamPlayerKanaElo({
 *   steam_id: "76561198012345678",
 *   kana_elo: 200
 * });
 * ```
 */
export const createMockSteamPlayerKanaElo = (
  overrides?: Partial<SteamPlayerKanaElo>
): SteamPlayerKanaElo => {
  return {
    id: 1,
    steam_id: "76561198012345678",
    kana_elo: 0,
    ...overrides
  };
};
