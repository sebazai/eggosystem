"use client";

import { fetcher } from "@/lib/utils";
import useSWR from "swr";
import type { MatchesByFilters } from "@eggosystem/types";

export const useMatches = (season = "any", stage = "any", map = "any") => {
  const { data, error, isValidating } = useSWR<MatchesByFilters[]>(
    `/api/matches?season=${season}&stage=${stage}&map=${map}`,
    fetcher
  );

  return {
    matches: data,
    isLoading: !data && !error,
    isError: error,
    isValidating
  };
};
