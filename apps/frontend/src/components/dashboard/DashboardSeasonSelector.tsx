"use client";

import { useEffect, useRef } from "react";
import { useAllSeasons } from "@/hooks/data/dashboard/useAllSeasons";
import { useDashboardSeason } from "@/hooks/data/dashboard/useDashboardSeason";
import { useActiveSeason } from "@/hooks/data/dashboard/useActiveSeason";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

/**
 * Season selector component for the dashboard sidebar.
 * Reads and writes season selection via URL search params.
 * Auto-selects active season if no season is selected.
 */
export function DashboardSeasonSelector() {
  const { seasons, isLoading } = useAllSeasons();
  const { selectedSeasonId, setSelectedSeasonId } = useDashboardSeason();
  const { activeSeasonId } = useActiveSeason();
  const hasAutoSelectedRef = useRef(false);

  // Auto-select active season if no season is selected and active season is available
  // Only auto-select once on initial load, not when user explicitly clears selection
  useEffect(() => {
    // Only auto-select if:
    // 1. We haven't already attempted auto-selection
    // 2. No season is currently selected
    // 3. Active season is available
    // 4. Seasons list is loaded
    if (
      !hasAutoSelectedRef.current &&
      !selectedSeasonId &&
      activeSeasonId &&
      seasons &&
      seasons.length > 0
    ) {
      // Check if active season exists in the seasons list
      const activeSeasonExists = seasons.some((s) => s.id === activeSeasonId);
      if (activeSeasonExists) {
        setSelectedSeasonId(activeSeasonId.toString());
        hasAutoSelectedRef.current = true;
      }
    }
  }, [selectedSeasonId, activeSeasonId, seasons, setSelectedSeasonId]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Spinner size="sm" />
        <span className="text-sm text-muted-foreground">
          Loading seasons...
        </span>
      </div>
    );
  }

  if (!seasons || seasons.length === 0) {
    return (
      <div className="px-2 py-1.5">
        <span className="text-sm text-muted-foreground">
          No seasons available
        </span>
      </div>
    );
  }

  return (
    <div
      className="px-2 py-1.5"
      data-testid="dashboard-season-selector-container"
    >
      <Select
        value={selectedSeasonId || "all"}
        onValueChange={(value) => {
          if (value === "all") {
            setSelectedSeasonId(null);
          } else {
            setSelectedSeasonId(value);
          }
        }}
      >
        <SelectTrigger className="w-full" data-testid="season-selector">
          <SelectValue placeholder="Select a season" />
        </SelectTrigger>
        <SelectContent data-testid="season-dropdown">
          <SelectItem value="all" className="text-muted-foreground">
            All Seasons
          </SelectItem>
          {seasons.map((season) => (
            <SelectItem
              key={season.id}
              value={season.id.toString()}
              data-testid={`season-option-${season.id}`}
            >
              {season.full_name || season.name || `Season ${season.id}`}
              {activeSeasonId === season.id && " (Active)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
