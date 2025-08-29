"use client";

import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";

// Helper hook to find the latest season a player has statistics in
export function usePlayerLatestSeason(steamId: string) {
  const { data, error, isValidating, isLoading } = useSWR<{
    season_id: number;
  }>(
    steamId ? `/api/v1/players/${steamId}/latest-season` : null,
    expressFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000 // Cache for 1 minute since this doesn't change often
    }
  );

  return {
    latestSeason: data?.season_id,
    isLoading,
    isError: error,
    isValidating
  };
}

// Alternative: Try different seasons until we find data
export function usePlayerStatisticsWithFallback(
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
  } = useSWR(
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
  } = useSWR(
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
