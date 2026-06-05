/** Suggested signup roster limits when creating a season (UI default only). */
export interface SignupPlayerLimits {
  min_players: number;
  max_players: number;
}

/**
 * Dashboard defaults keyed by `GameTypes.id` (see migration seed data).
 * Runtime signup always reads `SeasonSignupSettings` for the season.
 */
export const DEFAULT_SIGNUP_PLAYER_LIMITS_BY_GAME_TYPE_ID: Record<
  number,
  SignupPlayerLimits
> = {
  1: { min_players: 5, max_players: 9 }, // CS2 Comp
  2: { min_players: 2, max_players: 3 }, // CS2 Wingman
  3: { min_players: 2, max_players: 3 }, // PUBG Duo
  4: { min_players: 3, max_players: 10 }, // PUBG Squad
  5: { min_players: 3, max_players: 5 }, // Rocket League Standard
  6: { min_players: 5, max_players: 7 } // Dota Team clash
};

export function getDefaultSignupPlayerLimitsForGameTypeId(
  gameTypeId: number
): SignupPlayerLimits {
  return (
    DEFAULT_SIGNUP_PLAYER_LIMITS_BY_GAME_TYPE_ID[gameTypeId] ?? {
      min_players: 5,
      max_players: 9
    }
  );
}
