"use client";

import { expressFetcher } from "@/lib/utils";
import type { MatchTopPlayerAwards } from "@eggosystem/types";
import useSWR from "swr";

export function useMatchGameTopPlayers(matchId: number, gameId: number) {
  const { data, error, isValidating } = useSWR<MatchTopPlayerAwards>(
    `/api/v1/matches/${matchId}/games/${gameId}/topplayers`,
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
