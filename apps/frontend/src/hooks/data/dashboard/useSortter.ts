"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import { clientApiFetch } from "@/lib/apiClient";

export interface Season {
  id: number;
  name: string;
}

export interface TeamSortterValues {
  team_id: number;
  team_name: string;
  top5_values: number[];
  comments?: string;
}

export function useSortter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get the season parameter from URL or null
  const seasonParam = searchParams.get("season");
  const initialSeason = seasonParam ? parseInt(seasonParam, 10) : null;

  const [selectedSeason, setSelectedSeasonState] = useState<number | null>(
    initialSeason
  );

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

  // Handle the URL update when selected season changes
  const setSelectedSeason = (seasonId: number) => {
    setSelectedSeasonState(seasonId);

    // Update URL with the season parameter
    const params = new URLSearchParams(searchParams.toString());
    params.set("season", seasonId.toString());
    router.push(`?${params.toString()}`);
  };

  // Auto-select first season if none is selected
  useEffect(() => {
    if (
      seasons?.length &&
      selectedSeason === null &&
      seasons[0]?.id !== undefined
    ) {
      setSelectedSeason(seasons[0].id);
    }
  }, [seasons, selectedSeason]);

  return {
    teams: teams || [],
    seasons: seasons || [],
    selectedSeason,
    isLoadingTeams,
    isLoadingSeasons,
    error: teamsError || seasonsError,
    isValidatingTeams,
    isValidatingSeasons,
    setSelectedSeason
  };
}
