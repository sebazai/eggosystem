"use client";

import useSWR from "swr";
import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";
import type { PlayerStatistics } from "@eggosystem/types";

export function usePlayerStatistics(
  steamId: string,
  filters: FilterParamsQuery
) {
  const sortedQuery = generateFiltersParamQuery(filters);

  const { data, error, isValidating, isLoading } = useSWR<PlayerStatistics>(
    steamId
      ? `/api/v1/filters/players/${steamId}/statistics?${sortedQuery}`
      : null,
    expressFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 0
    }
  );

  return {
    playerStats: data,
    isLoading,
    isError: error,
    isValidating
  };
}
