"use client";

import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";
import useSWR from "swr";
import type { Nullable, PlayerStatsTable } from "@eggosystem/types";

interface UsePlayersProps extends FilterParamsQuery {
  player_name?: Nullable<string>;
}

export const useAllMultiplePlayersStats = (params: UsePlayersProps) => {
  const sortedQuery = generateFiltersParamQuery(params);

  const { data, error, isValidating, isLoading } = useSWR<PlayerStatsTable[]>(
    `/api/v1/filters/players/all/stats?${sortedQuery}`,
    expressFetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true
    }
  );

  return {
    players: data,
    isLoading,
    isError: error,
    isValidating
  };
};
