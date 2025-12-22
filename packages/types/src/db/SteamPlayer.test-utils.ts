import type { SteamPlayer } from "./SteamPlayer.interface";

/**
 * Creates a mock SteamPlayer object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial SteamPlayer object to override defaults
 * @returns Complete SteamPlayer object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const player = createMockSteamPlayer();
 *
 * // Override specific fields
 * const customPlayer = createMockSteamPlayer({
 *   steam_id: "76561198012345678",
 *   nickname: "TestPlayer"
 * });
 * ```
 */
export const createMockSteamPlayer = (
  overrides?: Partial<SteamPlayer>
): SteamPlayer => {
  return {
    steam_id: "76561198012345678",
    nickname: "Test Player",
    account_id: 1,
    faceit_id: null,
    faceit_nickname: null,
    avatar: null,
    ...overrides
  };
};
