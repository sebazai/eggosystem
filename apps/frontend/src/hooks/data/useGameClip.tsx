"use client";

import { expressFetcher } from "@/lib/utils";
import type { GameClip } from "@eggosystem/types";
import useSWR from "swr";

export function useGameClip(gameId: number) {
  const { data, error, isValidating, isLoading } = useSWR<GameClip | undefined>(
    `/api/v1/games/${gameId}/clip`,
    expressFetcher,
    {
      refreshInterval: (data) => {
        if (!data) {
          return 0;
        }

        if (
          data?.clip_status === "Processing" ||
          data?.clip_status === "Submitted"
        ) {
          return 10000;
        }
        if (data?.clip_status === "Error") {
          return 100000;
        }

        return 0;
      },
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
