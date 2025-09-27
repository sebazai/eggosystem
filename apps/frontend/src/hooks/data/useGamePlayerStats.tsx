"use client";

import { expressFetcher } from "@/lib/utils";
import type { MatchPlayerStats } from "@eggosystem/types";
import useSWR from "swr";

export function useGamePlayerStats(matchGameId: number, stat?: "CT" | "T") {
  const url = stat
    ? `/api/v1/match-games/${matchGameId}/playerstats?stat=${stat}`
    : `/api/v1/match-games/${matchGameId}/playerstats`;

  const { data, error, isValidating, isLoading } = useSWR<MatchPlayerStats[]>(
    url,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    playerStats: data,
    isLoading,
    isError: error,
    isValidating
  };
}
