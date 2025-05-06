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

export const usePlayerStats = ({ player_name, ...params }: UsePlayersProps) => {
  const sortedQuery = generateFiltersParamQuery(params);

  // Add player name search parameter if provided
  const playerNameQuery = player_name
    ? `&playerName=${encodeURIComponent(player_name)}`
    : "";

  const { data, error, isValidating, isLoading } = useSWR<PlayerStatsTable[]>(
    `/api/v1/filters/players/stats?${sortedQuery}${playerNameQuery}`,
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
