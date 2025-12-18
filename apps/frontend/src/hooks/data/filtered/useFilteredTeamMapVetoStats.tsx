"use client";

import type { TeamMapVetoStats } from "@eggosystem/types";
import useSWR from "swr";
import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";
import type { KeyedMutator } from "swr";

interface UseFilteredTeamMapVetoStatsProps {
  teamId: number | string;
  filterQueryParams: FilterParamsQuery;
}

export interface UseFilteredTeamMapVetoStatsReturn {
  vetoStats?: TeamMapVetoStats[];
  isLoading: boolean;
  error?: Error;
  isValidating: boolean;
  mutate: KeyedMutator<TeamMapVetoStats[]>;
}

export const useFilteredTeamMapVetoStats = ({
  teamId,
  filterQueryParams
}: UseFilteredTeamMapVetoStatsProps): UseFilteredTeamMapVetoStatsReturn => {
  const sortedQuery = generateFiltersParamQuery(filterQueryParams);

  const { data, error, isValidating, isLoading, mutate } = useSWR<
    TeamMapVetoStats[]
  >(
    `/api/v1/filters/teams/${teamId}/map-veto-stats?${sortedQuery}`,
    expressFetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true
    }
  );

  return {
    vetoStats: data,
    isLoading,
    error,
    isValidating,
    mutate
  };
};
