"use client";

import useSWR from "swr";
import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";
import type { TeamMapStats } from "@eggosystem/types";

export function useTeamMapStats(teamId: number, filters: FilterParamsQuery) {
  const sortedQuery = generateFiltersParamQuery(filters);

  const { data, error, isValidating, isLoading } = useSWR<TeamMapStats[]>(
    `/api/v1/filters/teams/${teamId}/map-stats?${sortedQuery}`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    mapStats: data,
    isLoading,
    isError: error,
    isValidating
  };
}
