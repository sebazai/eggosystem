"use client";

import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";
import type { StandingsResponse } from "@/types/standings";

export const useStandings = (
  leagueId: string
): {
  standings: StandingsResponse["data"];
  isLoading: boolean;
  isError: Error | undefined;
  isValidating: boolean;
  mutate: () => void;
} => {
  const apiUrl = `/api/v1/standings/${leagueId}`;

  const { data, error, isValidating, isLoading, mutate } =
    useSWR<StandingsResponse>(apiUrl, expressFetcher, {
      revalidateOnFocus: false,
      refreshInterval: 30000 // Refresh every 30 seconds
    });

  return {
    standings: data?.data || [],
    isLoading,
    isError: error,
    isValidating,
    mutate
  };
};
