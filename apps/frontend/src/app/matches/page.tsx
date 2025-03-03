"use client";

import { useState, useMemo } from "react";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { useRecentMatches } from "@/hooks/data/useRecentMatches";
import MatchContainer from "./match-container";
import { MultiFilters } from "@/components/filters/multi-filters";
import { FilteredMatchesList } from "./filtered-matches-list";

const getParamArray = (searchParams: ReadonlyURLSearchParams, key: string) =>
  searchParams
    .getAll(key)
    .map(Number)
    .filter((n) => !isNaN(n))
    .sort();

export default function AllMatches() {
  const searchParams = useSearchParams();

  const initialParams = useMemo(
    () => ({
      seasons: getParamArray(searchParams, "seasons"),
      leagues: getParamArray(searchParams, "leagues"),
      stages: getParamArray(searchParams, "stages"),
      teams: getParamArray(searchParams, "teams"),
      maps: getParamArray(searchParams, "maps")
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Only run once.
  );

  const [seasons, setSeasons] = useState<number[]>(initialParams.seasons);
  const [leagues, setLeagues] = useState<number[]>(initialParams.leagues);
  const [stages, setStages] = useState<number[]>(initialParams.stages);
  const [teams, setTeams] = useState<number[]>(initialParams.teams);
  const [maps, setMaps] = useState<number[]>(initialParams.maps);

  const { matches, isError, isLoading, isValidating } = useRecentMatches({
    seasons,
    leagues,
    stages,
    teams,
    maps
  });

  if (isError) {
    return (
      <MatchContainer>
        <div className="flex items-center justify-center min-h-[70vh]">
          Error loading Matches
        </div>
      </MatchContainer>
    );
  }

  return (
    <MatchContainer>
      <div className="p-0">
        <MultiFilters
          seasons={seasons}
          setSeasons={(value) => setSeasons(value)}
          leagues={leagues}
          setLeagues={(value) => setLeagues(value)}
          stages={stages}
          setStages={(value) => setStages(value)}
          teams={teams}
          setTeams={(value) => setTeams(value)}
          maps={maps}
          setMaps={(value) => setMaps(value)}
        />

        <FilteredMatchesList
          matches={matches}
          isLoading={isLoading || isValidating}
        />
      </div>
    </MatchContainer>
  );
}
