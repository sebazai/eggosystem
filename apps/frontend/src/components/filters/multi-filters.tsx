"use client";

import clsx from "clsx";
import { useState } from "react";
import { ItemFilter } from "./item-filter";
import type { League, Map, Season, Team } from "@eggosystem/types";
import { StageFilter } from "./stage-filter";
import { useMultiFilterSelectables } from "@/hooks/data/useMultiFilterSelectables";

interface MultiFiltersProps {
  seasons: number[];
  leagues: number[];
  stages: number[];
  teams: number[];
  maps: number[];
}

export const MultiFilters = (props: MultiFiltersProps) => {
  const [seasons, setSeasons] = useState(props.seasons);
  const [leagues, setLeagues] = useState(props.leagues);
  const [stages, setStages] = useState(props.stages);
  const [teams, setTeams] = useState(props.teams);
  const [maps, setMaps] = useState(props.maps);

  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const { filterData } = useMultiFilterSelectables({
    seasons,
    leagues,
    stages,
    teams,
    maps
  });

  const handleOpen = (filter: string | null) => {
    if (filter === null) {
      setOpenFilter(null);
      return;
    }
    setOpenFilter((prev: string | null) => (prev === filter ? null : filter));
  };

  // How many props are passed to FancyMultiSelect?
  const columns = Math.round(Object.keys(props).length / 2);
  return (
    <div
      className={clsx(
        `mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-2`,
        {
          "xl:grid-cols-5": columns === 5,
          "xl:grid-cols-4": columns === 4,
          "xl:grid-cols-3": columns === 3,
          "xl:grid-cols-2": columns === 2
        }
      )}
    >
      {props.seasons && (
        <ItemFilter<Season>
          filterName="seasons"
          labelKey="full_name"
          selectedItems={seasons}
          selectableIds={filterData?.season_ids}
          setSelectedItems={setSeasons}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      )}
      {props.leagues && (
        <ItemFilter<League>
          filterName="leagues"
          labelKey="name"
          selectedItems={leagues}
          selectableIds={filterData?.league_ids}
          setSelectedItems={setLeagues}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      )}
      {props.stages && (
        <StageFilter
          selectedStages={stages}
          setSelectedStageIds={setStages}
          selectableStages={filterData?.stages}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      )}
      {props.teams && (
        <ItemFilter<Team>
          filterName="teams"
          labelKey="name"
          selectedItems={teams}
          selectableIds={filterData?.team_ids}
          setSelectedItems={setTeams}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      )}
      {props.maps && (
        <ItemFilter<Map>
          filterName="maps"
          labelKey="name"
          selectedItems={maps}
          selectableIds={filterData?.map_ids}
          setSelectedItems={setMaps}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      )}
    </div>
  );
};
