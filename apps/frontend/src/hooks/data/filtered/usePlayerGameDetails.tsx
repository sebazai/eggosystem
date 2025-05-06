"use client";

import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";
import type { PlayerGameDetailsByFilters } from "@eggosystem/types";
import useSWR from "swr";

interface UsePlayerGameDetailsProps extends FilterParamsQuery {
  steamId: string;
}

export const usePlayerGameDetails = ({
  steamId,
  ...params
}: UsePlayerGameDetailsProps) => {
  const sortedQuery = generateFiltersParamQuery(params);
  const apiUrl = `/api/v1/filters/players/${steamId}/game-details?${sortedQuery}`;

  const { data, error, isValidating, isLoading } =
    useSWR<PlayerGameDetailsByFilters>(apiUrl, expressFetcher, {
      revalidateOnFocus: false
    });

  return {
    playerGameDetails: data,
    isLoading,
    isError: error,
    isValidating
  };
};
