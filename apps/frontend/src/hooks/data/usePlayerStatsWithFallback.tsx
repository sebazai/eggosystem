"use client";

import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";
import type { PlayerStatsResult } from "@eggosystem/types";

export function usePlayerStatsWithFallback(
  steamId: string,
  preferredSeasonId?: number
) {
  // First try the preferred season (current match season)
  const currentSeasonQuery = preferredSeasonId
    ? `season_ids=${preferredSeasonId}`
    : "";

  const {
    data: currentData,
    error: currentError,
    isLoading: isLoadingCurrent
  } = useSWR<PlayerStatsResult>(
    steamId && preferredSeasonId
      ? `/api/v1/filters/players/${steamId}/statistics?${currentSeasonQuery}`
      : null,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  // If no data in current season, try without season filter (gets latest available)
  const {
    data: fallbackData,
    error: fallbackError,
    isLoading: isLoadingFallback
  } = useSWR<PlayerStatsResult>(
    steamId && (!currentData || currentError)
      ? `/api/v1/filters/players/${steamId}/statistics`
      : null,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  const finalData = currentData || fallbackData;
  const finalError = currentError && fallbackError;

  return {
    playerStats: finalData,
    isLoading: isLoadingCurrent || isLoadingFallback,
    isError: finalError,
    usedFallback: !!fallbackData && !currentData
  };
}
