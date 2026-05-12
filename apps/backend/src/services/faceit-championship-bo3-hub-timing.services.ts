/**
 * Championship hub matches (FACEIT room → Matches rows): BO3+ uses ready-to-play
 * timestamps for start; finish must not overwrite that start. Excludes 2×BO1
 * double-row round-robin rooms (same criteria as the webhook controller).
 */

interface ChampionshipBo3HubTimingEligibility {
  faceitBestOf: number | undefined;
  isRoundRobinBo2As2xBo1: boolean;
  matchesInRoomCount: number;
}

export function isChampionshipBo3PlusHubTimingEligible(
  args: ChampionshipBo3HubTimingEligibility
): boolean {
  const bo = args.faceitBestOf;
  if (bo === undefined || bo < 3) return false;
  if (args.isRoundRobinBo2As2xBo1 && args.matchesInRoomCount === 2)
    return false;
  return true;
}
