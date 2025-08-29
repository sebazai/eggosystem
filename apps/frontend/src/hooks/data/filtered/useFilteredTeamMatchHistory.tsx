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
  enabled?: boolean;
}

export const useFilteredTeamMatchHistory = ({
  teamId,
  filterQueryParams,
  enabled = true
}: UseFilteredTeamMatchHistoryProps) => {
  const sortedQuery = generateFiltersParamQuery(filterQueryParams);

  // Only fetch if enabled and teamId is valid
  const shouldFetch = enabled && teamId && Number(teamId) > 0;

  const { data, error, isValidating, isLoading } = useSWR<TeamMatchHistory[]>(
    shouldFetch
      ? `/api/v1/filters/teams/${teamId}/match-history?${sortedQuery}`
      : null,
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
