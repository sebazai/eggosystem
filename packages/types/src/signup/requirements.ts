import { SeasonPlatform } from "../enums/SeasonPlatform";
import type { SeasonDetails } from "../seasons/index";
import type { SignupPlayerType } from "./index";

/**
 * Requirement flags persisted on Seasons; callers must resolve the season row.
 * Conservative default preserves legacy behaviour if data is unexpectedly missing.
 */
export interface SeasonSignupRankRequirements {
  faceit_rank_required: boolean;
  premier_rank_required: boolean;
  hours_played_required: boolean;
}

/**
 * Requirement flags persisted on Seasons; callers must resolve the season row.
 * Conservative default preserves legacy behaviour if data is unexpectedly missing.
 */
export function pickSignupRankRequirements(
  season: SeasonDetails | undefined | null
): SeasonSignupRankRequirements {
  if (!season) {
    return {
      faceit_rank_required: true,
      premier_rank_required: true,
      hours_played_required: true
    };
  }
  return {
    faceit_rank_required: !!season.faceit_rank_required,
    premier_rank_required: !!season.premier_rank_required,
    hours_played_required: !!season.hours_played_required
  };
}

export type SeasonSignupRequirementContext =
  | (SeasonSignupRankRequirements & { platform?: SeasonPlatform })
  | null
  | undefined;

/** FaceIT ladder rank is enforced only when required and the season is not on Kanaliiga. */
export function isFaceitRankEnforcedForSignup(
  seasonDetails: SeasonSignupRequirementContext
): boolean {
  return (
    !!seasonDetails?.faceit_rank_required &&
    seasonDetails.platform !== SeasonPlatform.Kanaliiga
  );
}

export function shouldFetchSignupPlayerHours(
  seasonDetails: SeasonSignupRequirementContext
): boolean {
  return !!seasonDetails?.hours_played_required;
}

export function shouldFetchSignupPlayerPremierRank(
  seasonDetails: SeasonSignupRequirementContext
): boolean {
  return !!seasonDetails?.premier_rank_required;
}

export function shouldFetchSignupPlayerExternalRank(
  seasonDetails: SeasonSignupRequirementContext
): boolean {
  return isFaceitRankEnforcedForSignup(seasonDetails);
}

/**
 * True when the player satisfies optional per-season rank and hours requirements.
 * Kanaliiga seasons do not use FaceIT ladder ranks; FaceIT rank is not enforced there.
 */
export function playerMeetsSeasonRankAndHoursRequirements(
  seasonDetails: SeasonSignupRequirementContext,
  player: Pick<SignupPlayerType, "rank" | "externalRank" | "hours">
): boolean {
  const faceitRankEnforced = isFaceitRankEnforcedForSignup(seasonDetails);

  return (
    (!seasonDetails?.premier_rank_required || player.rank !== -1) &&
    (!faceitRankEnforced || player.externalRank !== -1) &&
    (!seasonDetails?.hours_played_required || player.hours !== -1)
  );
}
