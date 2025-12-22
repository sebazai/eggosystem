import type { SignupFormValues, SignupPlayerType } from "./index";

/**
 * Creates a mock SignupPlayerType object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial SignupPlayerType object to override defaults
 * @returns Complete SignupPlayerType object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const player = createMockSignupPlayer();
 *
 * // Override specific fields
 * const customPlayer = createMockSignupPlayer({
 *   steamId: "76561198012345678",
 *   nickname: "TestPlayer",
 *   captain: true
 * });
 * ```
 */
export const createMockSignupPlayer = (
  overrides?: Partial<SignupPlayerType>
): SignupPlayerType => {
  return {
    accountId: 0,
    steamId: "76561198012345678",
    nickname: "Test Player",
    hasValidData: undefined,
    hasValidWorkEmail: undefined,
    isEmailVerified: undefined,
    hours: undefined,
    rank: undefined,
    externalRank: undefined,
    discord: undefined,
    discordLinked: undefined,
    captain: false,
    coCaptain: false,
    ...overrides
  };
};

/**
 * Creates a mock SignupFormValues object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial SignupFormValues object to override defaults
 * @returns Complete SignupFormValues object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults (for Kanaliiga platform)
 * const formValues = createMockSignupFormValues();
 *
 * // Override specific fields
 * const customFormValues = createMockSignupFormValues({
 *   organizationId: 1,
 *   teamId: 1650,
 *   platform: SeasonPlatform.FACEIT
 * });
 * ```
 */
export const createMockSignupFormValues = (
  overrides?: Partial<SignupFormValues>
): SignupFormValues => {
  const players = Array(5)
    .fill(null)
    .map((_, index) =>
      createMockSignupPlayer({
        steamId: `7656119801234567${index}`,
        nickname: `Test Player ${index + 1}`,
        captain: index === 0,
        coCaptain: index === 1,
        discordLinked: index < 2 ? true : undefined
      })
    );

  return {
    organizationId: 1,
    teamId: 1,
    teamExternalId: undefined,
    newOrganization: undefined,
    newTeam: undefined,
    captainHasReadTermAndConditions: true,
    players,
    ...overrides
  };
};
