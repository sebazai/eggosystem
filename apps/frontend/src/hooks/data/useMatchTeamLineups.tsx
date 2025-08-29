"use client";

import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";
import type { MatchTeamLineup } from "@eggosystem/types";

export function useMatchTeamLineups(matchId: number) {
  const { data, error, isValidating, isLoading } = useSWR<
    Record<string, MatchTeamLineup>
  >(`/api/v1/matches/${matchId}/lineups`, expressFetcher, {
    revalidateOnFocus: false,
    // Add cache-busting to force fresh data
    refreshInterval: 0,
    dedupingInterval: 0
  });

  return {
    lineups: data,
    isLoading,
    isError: error,
    isValidating
  };
}
