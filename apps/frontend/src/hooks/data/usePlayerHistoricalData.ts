"use client";

import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import type {
  PlayerHistoricalData,
  PlayerHistoricalAverage,
  PlayerActiveSeasons,
  PlayerSeasonContextQuery,
  HistoricalDataParams
} from "@eggosystem/types";
import { buildPlayerSeasonsContextSearchParams } from "@/lib/player-season-context";

export function usePlayerSeasonsContext(
  steamId: string,
  context: PlayerSeasonContextQuery | null
) {
  const url =
    steamId && context
      ? `/api/v1/players/${steamId}/seasons/context?${buildPlayerSeasonsContextSearchParams(context)}`
      : null;
  const { data, error, isLoading } = useSWR<PlayerActiveSeasons>(
    url,
    clientApiFetch,
    { revalidateOnFocus: false, dedupingInterval: 5 * 60 * 1000 }
  );
  return { data, error, isLoading };
}

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
    if (params.season_id)
      searchParams.append("season_id", params.season_id.toString());
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
    dedupingInterval: 5 * 60 * 1000
  });

  return { data: data || [], error, isLoading, isValidating, mutate };
}

export function usePlayerHistoricalAverageByRank(
  rank: number | null,
  params?: HistoricalDataParams
) {
  const buildQueryString = (params?: HistoricalDataParams) => {
    if (!params) return "";
    const searchParams = new URLSearchParams();
    if (params.games) searchParams.append("games", params.games.toString());
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
      dedupingInterval: 10 * 60 * 1000
    });

  return { data, error, isLoading, isValidating };
}

export function usePlayerHistoricalAverageByLevel(
  level: number | null,
  params?: HistoricalDataParams
) {
  const buildQueryString = (params?: HistoricalDataParams) => {
    if (!params) return "";
    const searchParams = new URLSearchParams();
    if (params.games) searchParams.append("games", params.games.toString());
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
      dedupingInterval: 10 * 60 * 1000
    });

  return { data, error, isLoading, isValidating };
}

export function usePlayerHistoricalAverage(params?: HistoricalDataParams) {
  const buildQueryString = (params?: HistoricalDataParams) => {
    if (!params) return "";
    const searchParams = new URLSearchParams();
    if (params.games) searchParams.append("games", params.games.toString());
    return searchParams.toString() ? `?${searchParams.toString()}` : "";
  };

  const queryString = buildQueryString(params);
  const url = `/api/v1/players/historical/avg${queryString}`;

  const { data, error, isLoading, isValidating } =
    useSWR<PlayerHistoricalAverage>(url, clientApiFetch, {
      revalidateOnFocus: false,
      dedupingInterval: 10 * 60 * 1000
    });

  return { data, error, isLoading, isValidating };
}

/**
 * Converts a UI period string to HistoricalDataParams.
 * Season-relative periods ("this_season", "last_season") are handled by
 * the caller using usePlayerSeasonsContext — pass season_id directly instead.
 */
export function parsePeriodToParams(period: string): HistoricalDataParams {
  if (period.startsWith("last_")) {
    const games = parseInt(period.replace("last_", ""));
    if (!isNaN(games)) return { games };
  }
  return {};
}
