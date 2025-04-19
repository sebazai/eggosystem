"use client";

import React from "react";
import { MultiFilters } from "@/components/filters/multi-filters";

import { WithActiveSeason } from "@/components/filters/with-active-season";
import { LeaderboardsGrid } from "@/components/leaderboards/leaderboards-grid";
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { TheContainer } from "@/components/layout/the-container";

export default function LeaderboardsPage() {
  const { filterParams } = useActiveSeason("730");
  if (!filterParams) {
    return <TheContainer>Fetching filters...</TheContainer>;
  }
  return (
    <WithActiveSeason>
      <div className="p-0">
        <MultiFilters {...filterParams} />

        <div className="min-h-fit pb-8 px-4 bg-card">
          <div className="max-w-[1400px] mx-auto">
            <LeaderboardsGrid filterQueryParams={filterParams} />
          </div>
        </div>
      </div>
    </WithActiveSeason>
  );
}
