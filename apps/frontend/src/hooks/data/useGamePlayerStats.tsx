"use client";

import { expressFetcher } from "@/lib/utils";
import type { MatchPlayerStats } from "@eggosystem/types";
import useSWR from "swr";

export function useGamePlayerStats(gameId: number, stat?: "CT" | "T") {
  const url = stat
    ? `/api/v1/games/${gameId}/playerstats?stat=${stat}`
    : `/api/v1/games/${gameId}/playerstats`;

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
