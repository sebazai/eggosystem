"use client";

import type { MatchGame } from "@eggosystem/types";
import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";

export const useGetMatchGamesByExternalMatchRoomId = (
  externalMatchRoomId: string | null,
  enabled: boolean
) => {
  const { data, error, isLoading } = useSWR<MatchGame[]>(
    externalMatchRoomId && enabled
      ? `/api/v1/match-games/external/${externalMatchRoomId}/games`
      : null,
    expressFetcher
  );
  return {
    games: data,
    error,
    isLoading
  };
};
