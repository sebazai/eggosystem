"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { clientApiFetch } from "@/lib/apiClient";
import type { TeamPlacement } from "@eggosystem/types";
import { useComments } from "@/contexts/CommentsContext";

interface UseSavePlacementsProps {
  selectedSeason: number | null;
  placements: TeamPlacement[];
  divisions: { [key: number]: number };
  isViewMode: boolean;
  mutatePlacements: (
    data?: unknown,
    options?: { revalidate?: boolean }
  ) => Promise<unknown>;
  setIsSaving: (isSaving: boolean) => void;
}

export function useSavePlacements({
  selectedSeason,
  placements,
  divisions,
  isViewMode,
  mutatePlacements,
  setIsSaving
}: UseSavePlacementsProps) {
  const { getAllComments } = useComments();

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
      // Get all comments from the context
      const currentComments = getAllComments();
      const updatedPlacements = placements.map((placement) => ({
        ...placement,
        division: divisions[placement.team_id] || placement.division,
        comments: currentComments[placement.team_id] || placement.comments
      }));

      // Send the request to the server
      await clientApiFetch(
        `/api/v1/dashboard/sortter/season/${selectedSeason}/placements`,
        {
          method: "POST",
          body: JSON.stringify({ placements: updatedPlacements })
        }
      );

      // Force a complete revalidation by setting the data to undefined first
      await mutatePlacements(undefined);

      // Then trigger a fresh fetch from the server
      await mutatePlacements();

      toast.success("Placements saved successfully", {
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
  }, [
    selectedSeason,
    placements,
    divisions,
    getAllComments,
    mutatePlacements,
    isViewMode,
    setIsSaving
  ]);

  return savePlacements;
}
