"use client";

import type { TeamMapStats } from "@eggosystem/types";
import useSWR from "swr";
import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";

interface UseFilteredTeamMapStatsProps {
  teamId: number | string;
  filterQueryParams: FilterParamsQuery;
}

export const useFilteredTeamMapStats = ({
  teamId,
  filterQueryParams
}: UseFilteredTeamMapStatsProps) => {
  const sortedQuery = generateFiltersParamQuery(filterQueryParams);

  const { data, error, isValidating, isLoading, mutate } = useSWR<
    TeamMapStats[]
  >(
    `/api/v1/filters/teams/${teamId}/map-stats?${sortedQuery}`,
    expressFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      revalidateIfStale: true,
      errorRetryCount: 3,
      dedupingInterval: 5000,
      keepPreviousData: true,
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Only retry up to 3 times
        if (retryCount >= 3) return;

        // Retry after 1 second
        setTimeout(() => revalidate({ retryCount }), 1000);
      }
    }
  );

  return {
    teamMapStats: data,
    isLoading,
    error,
    isValidating,
    mutate
  };
};
