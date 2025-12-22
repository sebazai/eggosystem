import type {
  RosterHistoryPlayer,
  RosterHistorySeason,
  RosterHistoryResponse
} from "./RosterHistory.interface";

/**
 * Creates a mock RosterHistoryPlayer object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial RosterHistoryPlayer object to override defaults
 * @returns Complete RosterHistoryPlayer object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const player = createMockRosterHistoryPlayer();
 *
 * // Override specific fields
 * const customPlayer = createMockRosterHistoryPlayer({
 *   steamId: "76561198012345678",
 *   nickname: "TestPlayer",
 *   isCaptain: true
 * });
 * ```
 */
export const createMockRosterHistoryPlayer = (
  overrides?: Partial<RosterHistoryPlayer>
): RosterHistoryPlayer => {
  return {
    steamId: "76561198012345678",
    nickname: "Test Player",
    isCaptain: false,
    isCoCaptain: false,
    ...overrides
  };
};

/**
 * Creates a mock RosterHistorySeason object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial RosterHistorySeason object to override defaults
 * @returns Complete RosterHistorySeason object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const season = createMockRosterHistorySeason();
 *
 * // Override specific fields
 * const customSeason = createMockRosterHistorySeason({
 *   seasonId: 14,
 *   seasonName: "CS2 Season 2"
 * });
 * ```
 */
export const createMockRosterHistorySeason = (
  overrides?: Partial<RosterHistorySeason>
): RosterHistorySeason => {
  return {
    seasonId: 1,
    seasonName: "Test Season",
    players: [createMockRosterHistoryPlayer()],
    ...overrides
  };
};

/**
 * Creates a mock RosterHistoryResponse object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial RosterHistoryResponse object to override defaults
 * @returns Complete RosterHistoryResponse object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const response = createMockRosterHistoryResponse();
 *
 * // Override specific fields
 * const customResponse = createMockRosterHistoryResponse({
 *   seasons: [createMockRosterHistorySeason({ seasonId: 14 })]
 * });
 * ```
 */
export const createMockRosterHistoryResponse = (
  overrides?: Partial<RosterHistoryResponse>
): RosterHistoryResponse => {
  return {
    seasons: [createMockRosterHistorySeason()],
    ...overrides
  };
};
