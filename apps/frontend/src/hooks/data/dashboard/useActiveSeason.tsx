"use client";

import { clientApiFetch } from "@/lib/apiClient";
import useSWR from "swr";

/**
 * Hook to fetch the active season for organizer 1, app 730 (CS2)
 * Returns the season_id of the active season
 */
export const useActiveSeason = () => {
  const apiUrl = "/api/v1/organizers/1/app/730/seasons/active";

  const { data, error, isValidating, isLoading } = useSWR<{
    season_id: number;
  }>(apiUrl, clientApiFetch, {
    revalidateOnFocus: false
  });

  return {
    activeSeasonId: data?.season_id,
    isLoading,
    isError: error,
    isValidating
  };
};
