"use client";

import { FaceitSyncButton } from "@/components/dashboard/FaceitSyncButton";
import { useDashboardSeason } from "@/hooks/data/dashboard/useDashboardSeason";

export function FaceitSyncSection() {
  const { selectedSeasonId } = useDashboardSeason();

  return <FaceitSyncButton seasonId={selectedSeasonId} />;
}
