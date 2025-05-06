"use client";

import type { TeamHeaderDetails } from "@eggosystem/types";
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

export const useFilteredTeamById = ({
  teamId,
  filterQueryParams
}: UseFilteredTeamProps) => {
  const sortedQuery = generateFiltersParamQuery(filterQueryParams);

  const { data, error, isValidating, isLoading } = useSWR<TeamHeaderDetails>(
    `/api/v1/filters/teams/${teamId}?${sortedQuery}`,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    team: data,
    isLoading,
    error,
    isValidating
  };
};
