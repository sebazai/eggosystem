"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import { clientApiFetch } from "@/lib/apiClient";
import type { TeamSortterValues, PlayerSortterValues } from "@eggosystem/types";

// Local type for season data from API
type Season = {
  id: number;
  name: string;
};

export function useSortter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get the season parameter from URL or null
  const seasonParam = searchParams.get("season");
  const initialSeason = seasonParam ? parseInt(seasonParam, 10) : null;

  const [selectedSeason, setSelectedSeasonState] = useState<number | null>(
    initialSeason
  );
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [floatingPosition, setFloatingPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Store prefetched data for teams
  const prefetchCache = useRef<Map<string, PlayerSortterValues[]>>(new Map());

  // Fetch available seasons
  const {
    data: seasons,
    error: seasonsError,
    isLoading: isLoadingSeasons,
    isValidating: isValidatingSeasons
  } = useSWR<Season[]>("/api/v1/seasons", clientApiFetch, {
    revalidateOnFocus: false
  });

  // Fetch team values for the selected season
  const {
    data: teams,
    error: teamsError,
    isLoading: isLoadingTeams,
    isValidating: isValidatingTeams
  } = useSWR<TeamSortterValues[]>(
    selectedSeason ? `/api/v1/sortter/season/${selectedSeason}` : null,
    clientApiFetch,
    {
      revalidateOnFocus: false
    }
  );

  // Fetch player values for the selected team
  const {
    data: playerValues,
    error: playerValuesError,
    isLoading: isLoadingPlayerValues,
    isValidating: isValidatingPlayerValues,
    mutate: mutatePlayerValues
  } = useSWR<PlayerSortterValues[]>(
    selectedSeason && selectedTeamId
      ? `/api/v1/sortter/season/${selectedSeason}/team/${selectedTeamId}/playervalues`
      : null,
    clientApiFetch,
    {
      revalidateOnFocus: false
    }
  );

  // Prefetch player values for hover
  const prefetchPlayerValues = useCallback(
    async (teamId: number) => {
      if (!selectedSeason) return;

      const key = `/api/v1/sortter/season/${selectedSeason}/team/${teamId}/playervalues`;

      // If we already have this data cached, don't refetch
      if (prefetchCache.current.has(key)) return;

      try {
        const data = await clientApiFetch<PlayerSortterValues[]>(key);
        prefetchCache.current.set(key, data);
      } catch (error) {
        console.error("Error prefetching player values:", error);
      }
    },
    [selectedSeason]
  );

  // Handle the URL update when selected season changes
  const setSelectedSeason = useCallback(
    (seasonId: number) => {
      setSelectedSeasonState(seasonId);

      // Update URL with the season parameter
      const params = new URLSearchParams(searchParams.toString());
      params.set("season", seasonId.toString());
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Show the floating team player values at the specified position
  const showTeamPlayerValues = useCallback(
    (teamId: number, position: { x: number; y: number }) => {
      setSelectedTeamId(teamId);
      setFloatingPosition(position);

      // Check if we have prefetched data for this team
      const key = `/api/v1/sortter/season/${selectedSeason}/team/${teamId}/playervalues`;

      if (prefetchCache.current.has(key)) {
        // Use the prefetched data
        const cachedData = prefetchCache.current.get(key);
        if (cachedData) {
          mutatePlayerValues(cachedData, false);
        }
      }
    },
    [selectedSeason, mutatePlayerValues]
  );

  // Close the floating window
  const closeTeamPlayerValues = useCallback(() => {
    setSelectedTeamId(null);
    setFloatingPosition(null);
  }, []);

  // Auto-select first season if none is selected
  useEffect(() => {
    if (
      seasons?.length &&
      selectedSeason === null &&
      seasons[0]?.id !== undefined
    ) {
      setSelectedSeason(seasons[0].id);
    }
  }, [seasons, selectedSeason, setSelectedSeason]);

  return {
    teams: teams || [],
    seasons: seasons || [],
    playerValues: playerValues || [],
    selectedSeason,
    selectedTeamId,
    floatingPosition,
    isLoadingTeams,
    isLoadingSeasons,
    isLoadingPlayerValues,
    error: teamsError || seasonsError || playerValuesError,
    isValidatingTeams,
    isValidatingSeasons,
    isValidatingPlayerValues,
    setSelectedSeason,
    showTeamPlayerValues,
    closeTeamPlayerValues,
    prefetchPlayerValues
  };
}
