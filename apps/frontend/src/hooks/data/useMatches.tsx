"use client";

import { fetcher } from "@/lib/utils";
import useSWR from "swr";
import type { MatchesByFilters } from "@eggosystem/types";

export const useMatches = () => {
  const { data, error, isValidating } = useSWR<MatchesByFilters[]>(
    "/api/matches",
    fetcher
  );

  return {
    matches: data,
    isLoading: !data && !error, // When there is no data and no error, it's loading
    isError: error,
    isValidating
  };
};
