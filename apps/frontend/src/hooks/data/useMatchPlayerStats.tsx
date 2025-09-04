"use client";

import { expressFetcher } from "@/lib/utils";
import type { MatchPlayerStats } from "@eggosystem/types";
import useSWR from "swr";

export function useMatchPlayerStats(matchId: number, stat?: "CT" | "T") {
  const url = stat
    ? `/api/v1/matches/${matchId}/playerstats?stat=${stat}`
    : `/api/v1/matches/${matchId}/playerstats`;

  const { data, error, isValidating } = useSWR<MatchPlayerStats[]>(
    url,
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
