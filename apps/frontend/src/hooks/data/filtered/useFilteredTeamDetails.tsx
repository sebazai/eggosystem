"use client";

import type { TeamStats } from "@eggosystem/types";
import useSWR from "swr";
import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";

interface UseFilteredTeamProps {
  teamId: number;
  filterQueryParams: FilterParamsQuery;
}

export const useFilteredTeamByIdDetails = ({
  teamId,
  filterQueryParams
}: UseFilteredTeamProps) => {
  const sortedQuery = generateFiltersParamQuery(filterQueryParams);

  const { data, error, isValidating, isLoading } = useSWR<TeamStats>(
    `/api/v1/filters/teams/${teamId}/details?${sortedQuery}`,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    teamDetails: data,
    isLoading,
    error,
    isValidating
  };
};
