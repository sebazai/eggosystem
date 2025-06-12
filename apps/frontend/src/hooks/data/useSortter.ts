"use client";

import { useState, useEffect } from "react";
import { fetchTeamValues } from "@/services/sortterService";
import { fetchSeasons } from "@/services/seasonService";
import type { TeamSortterValues } from "@/services/sortterService";
import type { Season } from "@/components/sortter/SeasonSelector";
import { useRouter, useSearchParams } from "next/navigation";

interface UseSortterResult {
  teams: TeamSortterValues[];
  seasons: Season[];
  selectedSeason: number | null;
  isLoadingTeams: boolean;
  isLoadingSeasons: boolean;
  error: Error | null;
  setSelectedSeason: (seasonId: number) => void;
}

export function useSortter(): UseSortterResult {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [teams, setTeams] = useState<TeamSortterValues[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeasonState] = useState<number | null>(
    () => {
      // Initialize from URL parameter if available
      const seasonParam = searchParams.get("season");
      return seasonParam ? parseInt(seasonParam, 10) : null;
    }
  );
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Function to update both state and URL
  const setSelectedSeason = (seasonId: number) => {
    setSelectedSeasonState(seasonId);

    // Update URL with the season parameter
    const params = new URLSearchParams(searchParams.toString());
    params.set("season", seasonId.toString());
    router.push(`?${params.toString()}`);
  };

  // Fetch seasons on mount
  useEffect(() => {
    async function getSeasons() {
      setIsLoadingSeasons(true);
      setError(null);

      try {
        const data = await fetchSeasons();
        setSeasons(data);

        // Auto-select the first season if none is selected
        if (data.length > 0 && selectedSeason === null) {
          setSelectedSeason(data[0]?.id ?? 0);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch seasons")
        );
      } finally {
        setIsLoadingSeasons(false);
      }
    }

    getSeasons();
  }, []); // Only run on mount

  // Fetch team values when selected season changes
  useEffect(() => {
    if (selectedSeason === null) return;

    async function getTeamValues() {
      setIsLoadingTeams(true);
      setError(null);

      try {
        // Type guard to ensure selectedSeason is a number
        if (typeof selectedSeason === "number") {
          const data = await fetchTeamValues(selectedSeason);
          setTeams(data);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch team values")
        );
      } finally {
        setIsLoadingTeams(false);
      }
    }

    getTeamValues();
  }, [selectedSeason]);

  return {
    teams,
    seasons,
    selectedSeason,
    isLoadingTeams,
    isLoadingSeasons,
    error,
    setSelectedSeason
  };
}
