"use client";

import { expressFetcher } from "@/lib/utils";
import type { MatchPlayerStats } from "@eggosystem/types";
import useSWR from "swr";

export function useGamePlayerStats(gameId: number) {
  const { data, error, isValidating, isLoading } = useSWR<MatchPlayerStats[]>(
    `/api/v1/games/${gameId}/playerstats`,
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
