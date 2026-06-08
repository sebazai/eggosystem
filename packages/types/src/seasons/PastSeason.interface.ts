import type { Season } from "../db";

export interface PastSeason extends Season {
  /** True if the season has teams slotted into leagues (standings exist). */
  has_standings: boolean;
  /** True if the season has at least one FantasyTeam registered. */
  has_fantasy: boolean;
  /** True if the season has a playoff bracket configured (SeasonLeagueExternalIds stage 2). */
  has_playoff: boolean;
  /** True if the season has at least one team captain assigned. */
  has_captains: boolean;
}
