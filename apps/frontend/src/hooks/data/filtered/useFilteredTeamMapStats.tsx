"use client";

import type { TeamMapStats } from "@eggosystem/types";
import useSWR from "swr";
import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";
import type { KeyedMutator } from "swr";

interface UseFilteredTeamMapStatsProps {
  teamId: number | string;
  filterQueryParams: FilterParamsQuery;
}

export interface UseFilteredTeamMapStatsReturn {
  teamMapStats?: TeamMapStats[];
  isLoading: boolean;
  error?: Error;
  isValidating: boolean;
  mutate: KeyedMutator<TeamMapStats[]>;
}

export const useFilteredTeamMapStats = ({
  teamId,
  filterQueryParams
}: UseFilteredTeamMapStatsProps): UseFilteredTeamMapStatsReturn => {
  const sortedQuery = generateFiltersParamQuery(filterQueryParams);

  const { data, error, isValidating, isLoading, mutate } = useSWR<
    TeamMapStats[]
  >(
    `/api/v1/teams/${teamId}/enhanced-map-stats?${sortedQuery}`,
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
