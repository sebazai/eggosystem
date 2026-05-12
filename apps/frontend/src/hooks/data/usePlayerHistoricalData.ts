"use client";

import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import type {
  PlayerHistoricalData,
  PlayerHistoricalAverage,
  HistoricalDataParams
} from "@eggosystem/types";

/**
/**
 * Hook to fetch individual player's historical data
 */
export function usePlayerHistoricalData(
  steamId: string,
  params?: HistoricalDataParams
): {
  data: PlayerHistoricalData[];
  error: unknown;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => void;
} {
  const buildQueryString = (params?: HistoricalDataParams) => {
    if (!params) return "";

    const searchParams = new URLSearchParams();
    if (params.games) searchParams.append("games", params.games.toString());
    if (params.period) searchParams.append("period", params.period);
    if (params.app_id) searchParams.append("app_id", params.app_id.toString());
    if (params.organizer_id)
      searchParams.append("organizer_id", params.organizer_id.toString());

    return searchParams.toString() ? `?${searchParams.toString()}` : "";
  };

  const queryString = buildQueryString(params);
  const url = steamId
    ? `/api/v1/players/${steamId}/historical-data${queryString}`
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    PlayerHistoricalData[]
  >(url, clientApiFetch, {
    revalidateOnFocus: false,
    dedupingInterval: 5 * 60 * 1000 // 5 minutes cache
  });

  return {
    data: data || [],
    error,
    isLoading,
    isValidating,
    mutate
  };
}

/**
 * Hook to fetch historical averages by CS2 rank
 */
export function usePlayerHistoricalAverageByRank(
  rank: number | null,
  params?: HistoricalDataParams
) {
  const buildQueryString = (params?: HistoricalDataParams) => {
    if (!params) return "";

    const searchParams = new URLSearchParams();
    if (params.games) searchParams.append("games", params.games.toString());
    if (params.period) searchParams.append("period", params.period);

    return searchParams.toString() ? `?${searchParams.toString()}` : "";
  };

  const queryString = buildQueryString(params);
  const url =
    rank !== null
      ? `/api/v1/players/historical/rank/${rank}${queryString}`
      : null;

  const { data, error, isLoading, isValidating } =
    useSWR<PlayerHistoricalAverage>(url, clientApiFetch, {
      revalidateOnFocus: false,
      dedupingInterval: 10 * 60 * 1000 // 10 minutes cache for averages
    });

  return {
    data,
    error,
    isLoading,
    isValidating
  };
}

/**
 * Hook to fetch historical averages by Faceit level
 */
export function usePlayerHistoricalAverageByLevel(
  level: number | null,
  params?: HistoricalDataParams
) {
  const buildQueryString = (params?: HistoricalDataParams) => {
    if (!params) return "";

    const searchParams = new URLSearchParams();
    if (params.games) searchParams.append("games", params.games.toString());
    if (params.period) searchParams.append("period", params.period);

    return searchParams.toString() ? `?${searchParams.toString()}` : "";
  };

  const queryString = buildQueryString(params);
  const url =
    level !== null
      ? `/api/v1/players/historical/level/${level}${queryString}`
      : null;

  const { data, error, isLoading, isValidating } =
    useSWR<PlayerHistoricalAverage>(url, clientApiFetch, {
      revalidateOnFocus: false,
      dedupingInterval: 10 * 60 * 1000 // 10 minutes cache for averages
    });

  return {
    data,
    error,
    isLoading,
    isValidating
  };
}

/**
 * Hook to fetch overall historical averages
 */
export function usePlayerHistoricalAverage(params?: HistoricalDataParams) {
  const buildQueryString = (params?: HistoricalDataParams) => {
    if (!params) return "";

    const searchParams = new URLSearchParams();
    if (params.games) searchParams.append("games", params.games.toString());
    if (params.period) searchParams.append("period", params.period);

    return searchParams.toString() ? `?${searchParams.toString()}` : "";
  };

  const queryString = buildQueryString(params);
  const url = `/api/v1/players/historical/avg${queryString}`;

  const { data, error, isLoading, isValidating } =
    useSWR<PlayerHistoricalAverage>(url, clientApiFetch, {
      revalidateOnFocus: false,
      dedupingInterval: 10 * 60 * 1000 // 10 minutes cache for averages
    });

  return {
    data,
    error,
    isLoading,
    isValidating
  };
}

/**
 * Helper function to parse period options to API parameters
 */
export function parsePeriodToParams(period: string): HistoricalDataParams {
  if (period === "this_season" || period === "last_season") {
    return { period };
  }

  // Extract number of games from period like "last_15", "last_30", etc.
  if (period.startsWith("last_")) {
    const games = parseInt(period.replace("last_", ""));
    if (!isNaN(games)) {
      return { games };
    }
  }

  // Default to no filtering for "all_seasons" or unknown periods
  return {};
}
