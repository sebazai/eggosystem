"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";
import type { FantasyPlayerStats } from "@eggosystem/types";

export const useFantasyPlayers = (
  seasonId: string,
  leagueId: string | null
) => {
  const { data, error, isValidating, isLoading } = useSWR<
    FantasyPlayerStats[],
    Error
  >(
    leagueId
      ? `/api/v1/seasons/${seasonId}/fantasy/leagues/${leagueId}/players`
      : null,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    players: data,
    isLoading,
    isError: error,
    isValidating
  };
};
