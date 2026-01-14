"use client";

import { useDashboardSeason } from "@/hooks/data/dashboard/useDashboardSeason";
import { useAllSeasons } from "@/hooks/data/dashboard/useAllSeasons";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

/**
 * Badge component that displays the currently selected season.
 * Shows nothing if no season is selected.
 */
export function SelectedSeasonBadge() {
  const { selectedSeasonId } = useDashboardSeason();
  const { seasons } = useAllSeasons();

  if (!selectedSeasonId) {
    return null;
  }

  const selectedSeason = seasons?.find(
    (s) => s.id.toString() === selectedSeasonId
  );

  if (!selectedSeason) {
    return null;
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1.5">
      <Calendar className="h-3 w-3" />
      <span className="font-medium">
        {selectedSeason.full_name ||
          selectedSeason.name ||
          `Season ${selectedSeason.id}`}
      </span>
    </Badge>
  );
}
