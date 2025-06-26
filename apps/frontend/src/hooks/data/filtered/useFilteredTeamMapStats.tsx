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
      keepPreviousData: true
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
