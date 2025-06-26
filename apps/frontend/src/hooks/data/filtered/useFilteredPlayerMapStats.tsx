"use client";

import type { PlayerMapStats } from "@eggosystem/types";
import useSWR from "swr";
import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";

interface UseFilteredPlayerMapStatsProps {
  steamId: string;
  filterQueryParams: FilterParamsQuery;
}

export const useFilteredPlayerMapStats = ({
  steamId,
  filterQueryParams
}: UseFilteredPlayerMapStatsProps) => {
  const query = generateFiltersParamQuery(filterQueryParams);

  // Use SWR to fetch and cache the data from the new backend endpoint
  const { data, error, isValidating, isLoading } = useSWR<PlayerMapStats[]>(
    `/api/v1/players/${steamId}/map-stats?${query}`,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    playerMapStats: data,
    isLoading,
    error,
    isValidating
  };
};
