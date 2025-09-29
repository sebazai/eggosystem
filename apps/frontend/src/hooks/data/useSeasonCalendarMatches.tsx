"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR, { type SWRResponse } from "swr";
import type { MatchWithStreamUrls } from "@eggosystem/types";

export const useSeasonCalendarMatches = (
  seasonId: string,
  selectedLeagueId: string | number
): SWRResponse<MatchWithStreamUrls[], Error> => {
  const { data, isLoading, isValidating, error, mutate } = useSWR<
    MatchWithStreamUrls[]
  >(
    `/api/v1/calendar/seasons/${seasonId}/leagues/${selectedLeagueId}/matches`,
    expressFetcher
  );

  return {
    data,
    isLoading: isLoading,
    error,
    isValidating,
    mutate
  };
};
