import clsx from "clsx";
import { useState } from "react";
import { ItemFilter } from "./item-filter";
import type { League, Map, Season, Team } from "@eggosystem/types";
import { StageFilter } from "./stage-filter";

interface MultiFiltersProps {
  seasons?: number[];
  setSeasons?: (seasons: number[]) => void;
  leagues?: number[];
  setLeagues?: (leagues: number[]) => void;
  stages?: number[];
  setStages?: (stages: number[]) => void;
  teams?: number[];
  setTeams?: (teams: number[]) => void;
  maps?: number[];
  setMaps?: (maps: number[]) => void;
}

export const MultiFilters = (props: MultiFiltersProps) => {
  const [openFilter, setOpenFilter] = useState<string | null>(null);

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
      {props.seasons && props.setSeasons && (
        <ItemFilter<Season>
          filterName="seasons"
          labelKey="full_name"
          selectedItems={props.seasons}
          setSelectedItems={props.setSeasons}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      )}
      {props.leagues && props.setLeagues && (
        <ItemFilter<League>
          filterName="leagues"
          labelKey="name"
          selectedItems={props.leagues}
          setSelectedItems={props.setLeagues}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      )}
      {props.stages && props.setStages && (
        <StageFilter
          selectedStages={props.stages}
          setSelectedStageIds={props.setStages}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      )}
      {props.teams && props.setTeams && (
        <ItemFilter<Team>
          filterName="teams"
          labelKey="name"
          selectedItems={props.teams}
          setSelectedItems={props.setTeams}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      )}
      {props.maps && props.setMaps && (
        <ItemFilter<Map>
          filterName="maps"
          labelKey="name"
          selectedItems={props.maps}
          setSelectedItems={props.setMaps}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      )}
    </div>
  );
};
