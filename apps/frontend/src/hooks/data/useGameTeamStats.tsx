"use client";

import { expressFetcher } from "@/lib/utils";
import type { GameTeamStats } from "@eggosystem/types";
import useSWR from "swr";

export function useGameTeamStats(matchGameId: number) {
  const { data, error, isLoading, isValidating } = useSWR<GameTeamStats[]>(
    `/api/v1/match-games/${matchGameId}/teamstats`,
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
