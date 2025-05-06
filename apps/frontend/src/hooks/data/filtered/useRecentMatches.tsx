"use client";

import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";
import useSWR from "swr";
import type { MatchesByFilters } from "@eggosystem/types";

export const useRecentMatches = (params: FilterParamsQuery) => {
  const sortedQuery = generateFiltersParamQuery(params);

  const { data, error, isValidating } = useSWR<MatchesByFilters[]>(
    `/api/v1/filters/matches/recent?${sortedQuery}`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    matches: data,
    isLoading: !data && !error,
    isError: error,
    isValidating
  };
};
