"use client";

import { expressFetcher } from "@/lib/utils";
import type { GameClip } from "@eggosystem/types";
import useSWR from "swr";

export function useGameClip(matchGameId: number) {
  const { data, error, isValidating, isLoading } = useSWR<GameClip | undefined>(
    `/api/v1/match-games/${matchGameId}/clip`,
    expressFetcher,
    {
      refreshInterval: (data) => {
        if (
          data?.clip_status === "Processing" ||
          data?.clip_status === "Submitted"
        ) {
          return 30000;
        }
        if (data?.clip_status === "Error") {
          return 100000;
        }

        return 0;
      },
      revalidateOnFocus: true,
      shouldRetryOnError: false
    }
  );

  return {
    clip: data,
    isLoading,
    isError: error,
    isValidating
  };
}
