"use client";

import { expressFetcher } from "@/lib/utils";
import type { MatchOrGameTopPlayerAwards } from "@eggosystem/types";
import useSWR from "swr";

export function useGameTopPlayers(matchGameId: number) {
  const { data, error, isValidating } = useSWR<MatchOrGameTopPlayerAwards>(
    `/api/v1/match-games/${matchGameId}/topplayers`,
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
