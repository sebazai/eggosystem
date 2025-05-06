"use client";

import { expressFetcher } from "@/lib/utils";
import type { GameTeamStats } from "@eggosystem/types";
import useSWR from "swr";

export function useGameTeamStats(gameId: number) {
  const { data, error, isLoading, isValidating } = useSWR<GameTeamStats[]>(
    `/api/v1/games/${gameId}/teamstats`,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    teamStats: data,
    isLoading,
    isError: error,
    isValidating
  };
}
