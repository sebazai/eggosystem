"use client";

import { MultiFilters } from "@/components/filters/multi-filters";
import { FilteredMatchesList } from "@/components/matches/filtered-matches-list";
import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import _ from "lodash";
import { WithActiveSeason } from "@/components/filters/with-active-season";
import { TheContainer } from "@/components/layout/the-container";

export default function AllMatches() {
  const activeSeasonHook = useActiveSeason("730");

  if (!activeSeasonHook.filterParams) {
    return <TheContainer>Fetching active season...</TheContainer>;
  }

  return (
    <div className="p-0">
      <h1>Recent matches</h1>
      <WithActiveSeason>
        <div className="py-2">
          <MultiFilters
            seasons={activeSeasonHook.filterParams.seasons}
            leagues={activeSeasonHook.filterParams.leagues}
            stages={activeSeasonHook.filterParams.stages}
            teams={activeSeasonHook.filterParams.teams}
            maps={null}
          />
        </div>

        <FilteredMatchesList
          filterQueryParams={activeSeasonHook.filterParams}
        />
      </WithActiveSeason>
    </div>
  );
}
