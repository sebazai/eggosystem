import {
  SeasonPlatform,
  type SeasonDetails,
  type SignupPlayerType
} from "@eggosystem/types";

/** Subset used for rank/hours gating (submit, errors, remove-player modal). */
type SeasonRankHoursRequirementSource = Pick<
  SeasonDetails,
  | "premier_rank_required"
  | "faceit_rank_required"
  | "hours_played_required"
  | "platform"
>;

/**
 * True when the player satisfies optional per-season rank and hours requirements.
 * Kanaliiga seasons do not use FaceIT ladder ranks; FaceIT rank is not enforced there.
 */
export function playerMeetsSeasonRankAndHoursRequirements(
  seasonDetails: SeasonRankHoursRequirementSource | null | undefined,
  player: Pick<SignupPlayerType, "rank" | "externalRank" | "hours">
): boolean {
  return (
    (!seasonDetails?.premier_rank_required || player.rank !== -1) &&
    (!seasonDetails?.faceit_rank_required ||
      player.externalRank !== -1 ||
      seasonDetails?.platform === SeasonPlatform.Kanaliiga) &&
    (!seasonDetails?.hours_played_required || player.hours !== -1)
  );
}
