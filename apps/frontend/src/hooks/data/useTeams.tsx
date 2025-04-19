"use client";

import type { TeamStats } from "@eggosystem/types";
import useSWR from "swr";
import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";

export const useTeams = (params: FilterParamsQuery) => {
  const sortedQuery = generateFiltersParamQuery(params);

  // Use SWR to fetch data from the backend
  const { data, error, isLoading, isValidating } = useSWR<TeamStats[]>(
    `/api/v1/teams/filtered?${sortedQuery}`, // Skip fetch if using mock data
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    teams: data,
    isLoading,
    error,
    isValidating
  };
};
