"use client";

import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";
import type { PlayerStatsResult } from "@eggosystem/types";
import useSWR from "swr";

interface UsePlayerStatsProps extends FilterParamsQuery {
  steamId: string;
}

export const usePlayerStats = ({ steamId, ...params }: UsePlayerStatsProps) => {
  const sortedQuery = generateFiltersParamQuery(params);
  const apiUrl = `/api/v1/players/${steamId}/statistics?${sortedQuery}`;

  const { data, error, isValidating, isLoading } = useSWR<PlayerStatsResult>(
    apiUrl,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    playerStats: data,
    isLoading,
    isError: error,
    isValidating
  };
};
