"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import type {
  PlayerSortterValues,
  Season,
  TeamPlacement,
  TeamSortterValues
} from "@eggosystem/types";
import { toast } from "sonner";

type PlacementsResponse = {
  placements: TeamPlacement[];
  isFinalized: boolean;
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
  const [comments, setComments] = useState<{ [key: number]: string }>({});
  const [divisions, setDivisions] = useState<{ [key: number]: number }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);

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

  // Fetch preliminary placements for the selected season
  const {
    data: placementsResponse,
    error: placementsError,
    isLoading: isLoadingPlacements,
    mutate: mutatePlacements
  } = useSWR<PlacementsResponse>(
    selectedSeason && seasons && seasons.length > 0
      ? `/api/v1/sortter/season/${selectedSeason}/placements`
      : null,
    clientApiFetch,
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      dedupingInterval: 0 // Don't deduplicate requests
    }
  );

  // Extract placements from response
  const placements = useMemo(() => {
    return placementsResponse?.placements || [];
  }, [placementsResponse?.placements]);

  // Sort teams by division first, then by avg4 within each division
  const sortedTeams = useMemo(() => {
    if (!teams || !placements) return [];

    // Create a map of team_id to division from placements
    const divisionMap = placements.reduce(
      (map, placement) => {
        map[placement.team_id] = placement.division;
        return map;
      },
      {} as Record<number, number>
    );

    // Sort teams by division first, then by avg4 within each division
    return [...teams].sort((a, b) => {
      const divA = divisionMap[a.team_id] || 999; // Default to a high division if not found
      const divB = divisionMap[b.team_id] || 999;

      // First sort by division
      if (divA !== divB) {
        return divA - divB;
      }

      // Then sort by avg4 (descending) within the same division
      return b.avg4 - a.avg4;
    });
  }, [teams, placements]);

  // Update view mode state when placements are loaded
  useEffect(() => {
    if (placementsResponse) {
      setIsViewMode(placementsResponse.isFinalized);
    }
  }, [placementsResponse]);

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

  // Initialize comments and divisions from placements
  useEffect(() => {
    if (placements && placements.length > 0) {
      const newComments: { [key: number]: string } = {};
      const newDivisions: { [key: number]: number } = {};

      placements.forEach((placement) => {
        newComments[placement.team_id] = placement.comments;
        newDivisions[placement.team_id] = placement.division;
      });

      setComments(newComments);
      setDivisions(newDivisions);
    }
  }, [placements]);

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

  // Show team player values in a floating window
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

  // Handle comment change for a team
  const handleCommentChange = useCallback((teamId: number, comment: string) => {
    setComments((prev) => ({
      ...prev,
      [teamId]: comment
    }));
  }, []);

  // Handle division change for a team
  const handleDivisionChange = useCallback(
    (teamId: number, division: number) => {
      setDivisions((prev) => ({
        ...prev,
        [teamId]: division
      }));
    },
    []
  );

  // Save preliminary placements
  const savePlacements = useCallback(async () => {
    if (!selectedSeason || !placements) return;

    // Don't allow saving in view mode
    if (isViewMode) {
      toast.error("Cannot modify placements - they have been finalized");
      return;
    }

    try {
      setIsSaving(true);

      // Create updated placements array
      const updatedPlacements = placements.map((placement) => ({
        ...placement,
        division: divisions[placement.team_id] || placement.division,
        comments: comments[placement.team_id] || placement.comments
      }));

      // Send the request to the server
      await clientApiFetch(
        `/api/v1/sortter/season/${selectedSeason}/placements`,
        {
          method: "POST",
          body: JSON.stringify({ placements: updatedPlacements })
        }
      );

      // Force a complete revalidation by setting the data to undefined first
      await mutatePlacements(undefined);

      // Then trigger a fresh fetch from the server
      await mutatePlacements();

      toast.success("Placements saved successfully");
    } catch (error) {
      console.error("Error saving placements", error);
      toast.error("Failed to save placements");
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedSeason,
    placements,
    divisions,
    comments,
    mutatePlacements,
    isViewMode
  ]);

  // Finalize placements to database
  const finalizePlacements = useCallback(async () => {
    if (!selectedSeason) return;

    // Don't allow finalizing in view mode
    if (isViewMode) {
      toast.error("Placements have already been finalized");
      return;
    }

    try {
      setIsFinalizing(true);

      // Save current placements first
      await savePlacements();

      // Then finalize
      await clientApiFetch(
        `/api/v1/sortter/season/${selectedSeason}/finalize`,
        {
          method: "POST"
        }
      );

      // Set view mode to true
      setIsViewMode(true);

      // Update the placements data with the new finalized status
      if (placementsResponse) {
        await mutatePlacements(
          { ...placementsResponse, isFinalized: true },
          false
        );
      }

      toast.success("Placements finalized and saved to database");
    } catch (error) {
      console.error("Error finalizing placements", error);
      toast.error("Failed to finalize placements");
    } finally {
      setIsFinalizing(false);
    }
  }, [
    selectedSeason,
    savePlacements,
    placementsResponse,
    mutatePlacements,
    isViewMode
  ]);

  return {
    teams: sortedTeams,
    seasons: seasons || [],
    playerValues: playerValues || [],
    placements,
    selectedSeason,
    selectedTeamId,
    floatingPosition,
    comments,
    divisions,
    isLoadingTeams,
    isLoadingSeasons,
    isLoadingPlayerValues,
    isLoadingPlacements,
    isSaving,
    isFinalizing,
    isViewMode,
    error: teamsError || seasonsError || playerValuesError || placementsError,
    isValidatingTeams,
    isValidatingSeasons,
    isValidatingPlayerValues,
    setSelectedSeason,
    showTeamPlayerValues,
    closeTeamPlayerValues,
    prefetchPlayerValues,
    handleCommentChange,
    handleDivisionChange,
    savePlacements,
    finalizePlacements
  };
}
