"use client";

import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";
import type { PlayerTeamDetailsByFilters } from "@eggosystem/types";
import useSWR from "swr";

interface UsePlayerTeamDetailsProps extends FilterParamsQuery {
  steamId: string;
}

export const usePlayerTeamDetails = ({
  steamId,
  ...params
}: UsePlayerTeamDetailsProps) => {
  const sortedQuery = generateFiltersParamQuery(params);
  const apiUrl = `/api/v1/filters/players/${steamId}/teams?${sortedQuery}`;

  const { data, error, isValidating, isLoading } = useSWR<
    Array<PlayerTeamDetailsByFilters>
  >(apiUrl, expressFetcher, {
    revalidateOnFocus: false
  });

  return {
    playerTeamDetails: data,
    isLoading,
    isError: error,
    isValidating
  };
};
