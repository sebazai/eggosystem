"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";
import type { MatchWithStreamUrls } from "@eggosystem/types";

export const useSeasonCalendarMatches = (
  seasonId: string,
  selectedLeagueId: string | number
) => {
  const { data, isLoading, isValidating, error } = useSWR<
    MatchWithStreamUrls[]
  >(
    `/api/v1/calendar/seasons/${seasonId}/leagues/${selectedLeagueId}/matches`,
    expressFetcher
  );

  return {
    calendarMatches: data,
    isLoading: isLoading,
    isError: error,
    isValidating
  };
};
