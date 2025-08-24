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
import { useComments } from "@/contexts/CommentsContext";

type PlacementsResponse = {
  placements: TeamPlacement[];
  isFinalized: boolean;
};

export function useSortter(placeTeamsInDivision: number) {
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

  // Use the comments context instead of local state
  const {
    setCommentForTeam,
    initializeComments,
    getAllComments,
    registerSaveFunction
  } = useComments();

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

  // Sort seasons in descending order (newest first)
  const sortedSeasons = useMemo(() => {
    if (!seasons) return [];
    return [...seasons].sort((a, b) => b.id - a.id);
  }, [seasons]);

  // Find current active season (default to the newest season with highest ID)
  const currentActiveSeason = useMemo(() => {
    if (!sortedSeasons.length) return null;
    // Since we don't have is_active property, just use the newest season (first in sorted array)
    return sortedSeasons[0];
  }, [sortedSeasons]);

  // Update selectedSeason when currentActiveSeason changes (for initial load)
  useEffect(() => {
    if (!selectedSeason && currentActiveSeason?.id) {
      setSelectedSeasonState(currentActiveSeason.id);
    }
  }, [selectedSeason, currentActiveSeason]);

  // Fetch team values for the selected season
  const {
    data: teams,
    error: teamsError,
    isLoading: isLoadingTeams,
    isValidating: isValidatingTeams
  } = useSWR<TeamSortterValues[]>(
    selectedSeason
      ? `/api/v1/dashboard/sortter/season/${selectedSeason}/teams`
      : null,
    clientApiFetch,
    {
      revalidateOnFocus: false
    }
  );

  // Debug: Log teams data when it changes
  useEffect(() => {
    if (teams && teams.length > 0) {
      console.log("Teams data received:", teams);
      const flaggedTeams = teams.filter((team) => team.is_flagged);
      console.log(
        `Flagged teams: ${flaggedTeams.length}/${teams.length}`,
        flaggedTeams.map((t) => ({
          id: t.team_id,
          name: t.team_name,
          flagged: t.is_flagged
        }))
      );
    }
  }, [teams]);

  // Fetch preliminary placements for the selected season
  const {
    data: placementsResponse,
    error: placementsError,
    isLoading: isLoadingPlacements,
    mutate: mutatePlacements
  } = useSWR<PlacementsResponse>(
    selectedSeason && seasons && seasons.length > 0
      ? `/api/v1/dashboard/sortter/season/${selectedSeason}/placements?teams_per_division=${placeTeamsInDivision}`
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
    return [...teams]
      .sort((a, b) => {
        const divA = divisionMap[a.team_id] || 999; // Default to a high division if not found
        const divB = divisionMap[b.team_id] || 999;

        // First sort by division
        if (divA !== divB) {
          return divA - divB;
        }

        // Then sort by avg4 (descending) within the same division
        return b.avg4 - a.avg4;
      })
      .map((team) => ({
        ...team,
        division: divisionMap[team.team_id] || null
      }));
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
      ? `/api/v1/dashboard/sortter/season/${selectedSeason}/team/${selectedTeamId}/playervalues`
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

      // Use context function to initialize comments
      initializeComments(newComments);
      setDivisions(newDivisions);
    }
  }, [placements, initializeComments]);

  // Prefetch player values for hover
  const prefetchPlayerValues = useCallback(
    async (teamId: number) => {
      if (!selectedSeason) return;

      const key = `/api/v1/dashboard/sortter/season/${selectedSeason}/team/${teamId}/playervalues`;

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
      const key = `/api/v1/dashboard/sortter/season/${selectedSeason}/team/${teamId}/playervalues`;

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

  // Handle comment blur (only update state when user finishes editing)
  const handleCommentBlur = useCallback(
    (teamId: number, comment: string) => {
      // Use the context function instead of local state with autoSave=true
      setCommentForTeam(teamId, comment, true);
    },
    [setCommentForTeam]
  );

  // Keep this for backwards compatibility (but it won't be used)
  const handleCommentChange = useCallback(() => {
    // No-op - we're using uncontrolled inputs now
  }, []);

  // Save preliminary placements
  const savePlacements = useCallback(
    async (overrideComments?: { [key: number]: string }) => {
      if (!selectedSeason || !placements) return;

      // Don't allow saving in view mode
      if (isViewMode) {
        toast.error("Cannot modify placements - they have been finalized");
        return;
      }

      try {
        setIsSaving(true);

        // Create updated placements array
        // Get all comments from the context, or use override if provided
        const currentComments = overrideComments || getAllComments();

        console.log("Current comments before save:", currentComments);
        console.log("Current divisions before save:", divisions);

        // Find only the placements that have actually changed
        const changedPlacements = placements
          .filter((placement) => {
            const currentDivision =
              divisions[placement.team_id] || placement.division;
            const currentComment =
              currentComments[placement.team_id] || placement.comments;

            // Only include placements that have changed
            return (
              currentDivision !== placement.division ||
              currentComment !== placement.comments
            );
          })
          .map((placement) => {
            // Create updated placement with current values
            const currentDivision =
              divisions[placement.team_id] || placement.division;
            const currentComment =
              currentComments[placement.team_id] || placement.comments;

            console.log(
              `Updating team ${placement.team_id}: division ${placement.division} -> ${currentDivision}, comment changed: ${placement.comments !== currentComment}`
            );

            return {
              ...placement,
              division: currentDivision,
              comments: currentComment
            };
          });

        // If nothing has changed, don't send a request
        if (changedPlacements.length === 0) {
          console.log("No changes detected, skipping save");
          setIsSaving(false);
          return;
        }

        console.log(
          `Saving ${changedPlacements.length} changed placements:`,
          changedPlacements
        );

        // Send only the changed placements to the server
        const response = await clientApiFetch(
          `/api/v1/dashboard/sortter/season/${selectedSeason}/placements`,
          {
            method: "POST",
            body: JSON.stringify({ placements: changedPlacements })
          }
        );

        console.log("Save response:", response);

        // Update the local cache with the changes
        if (placementsResponse) {
          // Create a map of changed placements for quick lookup
          const changedPlacementsMap = new Map(
            changedPlacements.map((placement) => [placement.team_id, placement])
          );

          // Create updated placements array by merging changes
          const updatedPlacements = placements.map((placement) => {
            const changed = changedPlacementsMap.get(placement.team_id);
            return changed || placement;
          });

          // Update the cache without revalidating
          mutatePlacements(
            {
              placements: updatedPlacements,
              isFinalized: placementsResponse.isFinalized
            },
            false // Don't revalidate from the server
          );
        }

        // Show a toast notification for autosave with better dark theme visibility
        toast.success("Changes saved successfully", {
          duration: 2000,
          position: "bottom-right",
          style: {
            background: "hsl(142.1 76.2% 36.3%)", // Darker green for better dark theme visibility
            color: "white",
            fontWeight: "500",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
          }
        });
      } catch (error) {
        console.error("Error saving placements", error);
        toast.error("Failed to save placements");
      } finally {
        setIsSaving(false);
      }
    },
    [
      selectedSeason,
      placements,
      divisions,
      getAllComments,
      mutatePlacements,
      isViewMode,
      placementsResponse
    ]
  );

  // Register the savePlacements function with the CommentsContext
  useEffect(() => {
    // Only register if we have a valid season and placements
    if (selectedSeason && placements) {
      registerSaveFunction(savePlacements);
    }
  }, [registerSaveFunction, savePlacements, selectedSeason, placements]);

  // Keep track of pending division changes to avoid race conditions
  const pendingDivisionChanges = useRef<Map<number, number>>(new Map());

  // Clean up pending changes when season changes
  useEffect(() => {
    pendingDivisionChanges.current.clear();
  }, [selectedSeason]);

  // Handle division change for a team
  const handleDivisionChange = useCallback(
    async (teamId: number, division: number, teamDivision: number | null) => {
      console.log(
        `Changing division for team ${teamId} from ${teamDivision} to ${division}`
      );

      // Track this change as pending
      pendingDivisionChanges.current.set(teamId, division);

      // Update local state first for immediate feedback
      const newDivisions = {
        ...divisions,
        [teamId]: division
      };

      // Set local state immediately for responsive UI
      setDivisions(newDivisions);

      // Auto-save by calling savePlacements directly
      if (!selectedSeason || !placements || isViewMode) {
        pendingDivisionChanges.current.delete(teamId); // Clean up
        return;
      }

      try {
        console.log("Current divisions before update:", divisions);
        console.log("New divisions with current change:", newDivisions);
        console.log(
          "All pending division changes:",
          Object.fromEntries(pendingDivisionChanges.current)
        );

        // Find the specific placement we're updating
        const teamPlacement = placements.find((p) => p.team_id === teamId);

        if (!teamPlacement) {
          console.error(`Team ${teamId} not found in placements`);
          pendingDivisionChanges.current.delete(teamId); // Clean up
          return;
        }

        // Create a single updated placement for just this team
        const updatedPlacement = {
          ...teamPlacement,
          division: division
        };

        // Send only this team's updated placement to the server
        // This is more efficient and avoids race conditions
        const singleTeamUpdate = [updatedPlacement];

        console.log("Sending single team update to server:", singleTeamUpdate);

        // Send the request to the server
        const response = await clientApiFetch(
          `/api/v1/dashboard/sortter/season/${selectedSeason}/placements`,
          {
            method: "POST",
            body: JSON.stringify({ placements: singleTeamUpdate })
          }
        );

        console.log("Division change saved successfully:", response);

        // Update the local SWR cache with all pending division changes
        if (placementsResponse) {
          // Create a new placements array with ALL pending division changes
          const updatedPlacements = placements.map((placement) => {
            // Check if this team has a pending division change
            const pendingDivision = pendingDivisionChanges.current.get(
              placement.team_id
            );

            if (pendingDivision !== undefined) {
              // Apply the pending division change
              return {
                ...placement,
                division: pendingDivision
              };
            }

            // No pending change, keep as is
            return placement;
          });

          console.log(
            "Updating cache with all pending changes:",
            Object.fromEntries(pendingDivisionChanges.current)
          );

          // Update the cache without revalidating
          mutatePlacements(
            {
              placements: updatedPlacements,
              isFinalized: placementsResponse.isFinalized
            },
            false // Don't revalidate from the server
          );

          // Also update the local divisions state to ensure consistency
          setDivisions((prev) => {
            const updated = { ...prev };
            // Apply all pending changes to local state
            pendingDivisionChanges.current.forEach((division, teamId) => {
              updated[teamId] = division;
            });
            return updated;
          });
        }

        // Don't remove from pending changes yet - keep it until we're sure it's stable
        // pendingDivisionChanges.current.delete(teamId);

        // Show a toast notification for autosave with better dark theme visibility
        toast.success("Division updated", {
          duration: 2000,
          position: "bottom-right",
          style: {
            background: "hsl(142.1 76.2% 36.3%)", // Darker green for better dark theme visibility
            color: "white",
            fontWeight: "500",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
          }
        });
      } catch (error) {
        console.error("Error auto-saving division change:", error);
        toast.error("Failed to save division change");

        // Remove from pending changes
        pendingDivisionChanges.current.delete(teamId);

        // Revert the local state change on error
        setDivisions((prev) => {
          const reverted = { ...prev };
          if (teamDivision !== null) {
            reverted[teamId] = teamDivision;
          } else {
            delete reverted[teamId];
          }
          return reverted;
        });
      }
    },
    [
      isViewMode,
      divisions,
      selectedSeason,
      placements,
      mutatePlacements,
      placementsResponse
    ]
  );

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

      // Get all current comments and divisions
      const currentComments = getAllComments();

      // Create updated placements with current state
      const updatedPlacements = placements.map((placement) => ({
        ...placement,
        division: divisions[placement.team_id] || placement.division,
        comments: currentComments[placement.team_id] || placement.comments
      }));

      // Save current placements first
      await clientApiFetch(
        `/api/v1/dashboard/sortter/season/${selectedSeason}/placements`,
        {
          method: "POST",
          body: JSON.stringify({ placements: updatedPlacements })
        }
      );

      // Then finalize
      await clientApiFetch(
        `/api/v1/dashboard/sortter/season/${selectedSeason}/finalize`,
        {
          method: "POST"
        }
      );

      // Set view mode to true
      setIsViewMode(true);

      // Update the placements data with the new finalized status without refreshing
      if (placementsResponse) {
        mutatePlacements(
          {
            placements: updatedPlacements,
            isFinalized: true
          },
          false // Don't revalidate
        );
      }

      toast.success("Placements finalized and saved to database", {
        duration: 3000,
        position: "bottom-right",
        style: {
          background: "hsl(142.1 76.2% 36.3%)", // Darker green for better dark theme visibility
          color: "white",
          fontWeight: "500",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
        }
      });
    } catch (error) {
      console.error("Error finalizing placements", error);
      toast.error("Failed to finalize placements");
    } finally {
      setIsFinalizing(false);
    }
  }, [
    selectedSeason,
    placements,
    divisions,
    getAllComments,
    placementsResponse,
    mutatePlacements,
    isViewMode
  ]);

  return {
    teams: sortedTeams,
    seasons: seasons || [],
    sortedSeasons: sortedSeasons || [],
    currentActiveSeason,
    playerValues: playerValues || [],
    placements,
    selectedSeason,
    selectedTeamId,
    floatingPosition,
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
    handleCommentBlur,
    handleDivisionChange,
    savePlacements,
    finalizePlacements
  };
}
