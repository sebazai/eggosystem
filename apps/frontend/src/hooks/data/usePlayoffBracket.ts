"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR, { type SWRResponse } from "swr";
import type { PlayoffBracketResponse } from "@eggosystem/types";

export const usePlayoffBracket = (
  seasonId: string,
  leagueId: string | number
): SWRResponse<PlayoffBracketResponse, Error> => {
  const { data, isLoading, isValidating, error, mutate } =
    useSWR<PlayoffBracketResponse>(
      `/api/v1/seasons/${seasonId}/leagues/${leagueId}/playoff/bracket`,
      expressFetcher
    );

  return {
    data,
    isLoading,
    error,
    isValidating,
    mutate
  };
};
