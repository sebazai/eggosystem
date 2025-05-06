"use client";

import { expressFetcher } from "@/lib/utils";
import type { MatchOrGameTopPlayerAwards } from "@eggosystem/types";
import useSWR from "swr";

export function useGameTopPlayers(gameId: number) {
  const { data, error, isValidating } = useSWR<MatchOrGameTopPlayerAwards>(
    `/api/v1/games/${gameId}/topplayers`,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    topPlayers: data,
    isLoading: !data && !error,
    isError: error,
    isValidating
  };
}
