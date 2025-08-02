"use client";

import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";
import type { StandingsFaceitTeamStats } from "@eggosystem/types";

interface StandingsResponse {
  standings: StandingsFaceitTeamStats[];
}

export const useStandings = (leagueId?: string) => {
  const apiUrl = leagueId ? `/api/v1/standings/${leagueId}` : null;

  const { data, error, isValidating, isLoading } = useSWR<StandingsResponse>(
    apiUrl,
    expressFetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 30000 // Refresh every 30 seconds
    }
  );

  return {
    standings: data?.standings || [],
    isLoading,
    isError: error,
    isValidating
  };
};
