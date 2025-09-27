"use client";

import { expressFetcher } from "@/lib/utils";
import type { GameType } from "@eggosystem/types";
import useSWR from "swr";

export const useGameTypes = (gameId?: number) => {
  const { data, error, isValidating } = useSWR<GameType[]>(
    gameId ? `/api/v1/games/${gameId}/types` : "/api/v1/games/types",
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    gameTypes: data || [],
    isLoading: !data && !error,
    isError: error,
    isValidating
  };
};
