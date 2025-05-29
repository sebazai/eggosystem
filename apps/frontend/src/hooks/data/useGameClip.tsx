"use client";

import { expressFetcher } from "@/lib/utils";
import type { GameClip } from "@eggosystem/types";
import useSWR from "swr";

export function useGameClip(gameId: number) {
  const { data, error, isValidating, isLoading } = useSWR<GameClip | undefined>(
    `/api/v1/games/${gameId}/clip`,
    expressFetcher,
    {
      refreshInterval: 10000,
      revalidateOnFocus: true
    }
  );

  return {
    clip: data,
    isLoading,
    isError: error,
    isValidating
  };
}
