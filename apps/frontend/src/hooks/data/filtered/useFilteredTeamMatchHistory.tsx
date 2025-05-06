"use client";

import type { TeamMatchHistory } from "@eggosystem/types";
import useSWR from "swr";
import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";

interface UseFilteredTeamMatchHistoryProps {
  teamId: number | string;
  filterQueryParams: FilterParamsQuery;
}

export const useFilteredTeamMatchHistory = ({
  teamId,
  filterQueryParams
}: UseFilteredTeamMatchHistoryProps) => {
  const sortedQuery = generateFiltersParamQuery(filterQueryParams);

  const { data, error, isValidating, isLoading } = useSWR<TeamMatchHistory[]>(
    `/api/v1/filters/teams/${teamId}/match-history?${sortedQuery}`,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    teamMatchHistory: data,
    isLoading,
    error,
    isValidating
  };
};
