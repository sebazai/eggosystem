"use client";

import { expressFetcher } from "@/lib/utils";
import type { MatchPlayerStats } from "@eggosystem/types";
import useSWR from "swr";

export function useMatchGamePlayerStats(matchId: string, gameId: string) {
  const { data, error, isValidating } = useSWR<MatchPlayerStats[]>(
    `/api/v1/matches/${matchId}/games/${gameId}/playerstats`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    playerStats: data,
    isLoading: !data && !error,
    isError: error,
    isValidating
  };
}
