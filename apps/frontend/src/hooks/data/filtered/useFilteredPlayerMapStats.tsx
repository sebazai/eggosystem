"use client";

import type { PlayerMapStats, PlayerStatsResult } from "@eggosystem/types";
import useSWR from "swr";
import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";
import { useMaps } from "../useMaps";

interface UseFilteredPlayerMapStatsProps {
  steamId: string;
  filterQueryParams: FilterParamsQuery;
}

interface GameDetailsResponse {
  matches_played: number;
  wins: number;
  losses: number;
}

export const useFilteredPlayerMapStats = ({
  steamId,
  filterQueryParams
}: UseFilteredPlayerMapStatsProps) => {
  // Get maps data
  const { mapsRecord, maps, isLoading: mapsLoading } = useMaps();

  // Get map filter if any
  const mapIds = filterQueryParams.maps || [];

  // Create a copy of filter params without maps to get overall stats
  const baseFilterParams = { ...filterQueryParams };
  if (baseFilterParams.maps) {
    baseFilterParams.maps = [];
  }
  const baseQuery = generateFiltersParamQuery(baseFilterParams);

  // If specific maps are selected, only fetch those
  // Otherwise, use all available maps from the API
  const mapsToFetch =
    mapIds.length > 0
      ? mapIds
      : maps.length > 0
        ? maps.map((map) => map.id)
        : [];

  // Use SWR to fetch and cache the data
  const { data, error, isValidating, isLoading } = useSWR<PlayerMapStats[]>(
    !mapsLoading && mapsToFetch.length > 0
      ? `/api/v1/players/${steamId}/map-stats-${baseQuery}`
      : null,
    async () => {
      const mapStatPromises = [];

      for (const mapId of mapsToFetch) {
        // Always include the map ID in the filter to ensure consistent calculation
        const mapFilterParams = { ...baseFilterParams, maps: [mapId] };
        const mapQuery = generateFiltersParamQuery(mapFilterParams);

        // Fetch stats for this map using expressFetcher
        const statsPromise = expressFetcher<PlayerStatsResult>(
          `/api/v1/filters/players/${steamId}/statistics?${mapQuery}`
        ).catch(() => null);

        // Fetch game details for this map using expressFetcher
        const detailsPromise = expressFetcher<GameDetailsResponse>(
          `/api/v1/filters/players/${steamId}/game-details?${mapQuery}`
        ).catch(() => null);

        // Wait for both promises and combine data
        const combinedPromise = Promise.all([
          statsPromise,
          detailsPromise
        ]).then(([stats, details]) => {
          if (!stats || !details) return null;

          return {
            ...stats,
            map_id: mapId,
            map_name: mapsRecord[mapId] || `unknown_map_${mapId}`,
            wins: details.wins,
            losses: details.losses,
            win_percentage:
              details.matches_played > 0
                ? (details.wins / details.matches_played) * 100
                : 0
          };
        });

        mapStatPromises.push(combinedPromise);
      }

      // Wait for all map stats to be fetched
      const results = await Promise.all(mapStatPromises);
      return results.filter(Boolean) as PlayerMapStats[];
    },
    {
      revalidateOnFocus: false
    }
  );

  return {
    playerMapStats: data,
    isLoading: isLoading || mapsLoading,
    error,
    isValidating
  };
};
