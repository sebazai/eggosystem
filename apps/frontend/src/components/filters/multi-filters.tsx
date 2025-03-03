"use client";

import clsx from "clsx";
import { useState } from "react";
import { ItemFilter } from "./item-filter";
import type { League, Map, Season, Team } from "@eggosystem/types";
import { StageFilter } from "./stage-filter";
import { useMultiFilterSelectables } from "@/hooks/data/useMultiFilterSelectables";
import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";

interface MultiFiltersProps {
  seasons: number[];
  leagues: number[];
  stages: number[];
  teams: number[];
  maps: number[];
}

// Function to update search params
const updateSearchParams = (
  searchParams: ReadonlyURLSearchParams,
  key: string,
  value: number[]
) => {
  const params = new URLSearchParams(searchParams.toString());

  params.delete(key);
  value.forEach((v) => params.append(key, v.toString()));

  window.history.pushState(null, "", `?${params.toString()}`);
};

export const MultiFilters = (props: MultiFiltersProps) => {
  const searchParams = useSearchParams();
  const [filterParams, setFilterParams] = useState({
    seasons: props.seasons,
    leagues: props.leagues,
    stages: props.stages,
    teams: props.teams,
    maps: props.maps
  });

  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const { filterData: multiFilterSelectData } =
    useMultiFilterSelectables(filterParams);

  const handleOpen = (filter: string | null) => {
    if (filter === null) {
      setOpenFilter(null);
      return;
    }
    setOpenFilter((prev: string | null) => (prev === filter ? null : filter));
  };

  const handleSetSearchParams = (key: string, values: number[]) => {
    updateSearchParams(searchParams, key, values);
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
          selectedItems={filterParams.seasons}
          setFilterParams={(newParams) =>
            setFilterParams({ ...filterParams, seasons: newParams })
          }
          selectableIds={multiFilterSelectData?.season_ids}
          handleSetSearchParams={handleSetSearchParams}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      )}
      {props.leagues && (
        <ItemFilter<League>
          filterName="leagues"
          labelKey="name"
          selectedItems={filterParams.leagues}
          setFilterParams={(newParams) =>
            setFilterParams({ ...filterParams, leagues: newParams })
          }
          selectableIds={multiFilterSelectData?.league_ids}
          handleSetSearchParams={handleSetSearchParams}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      )}
      {props.stages && (
        <StageFilter
          selectedStages={filterParams.stages}
          selectableStages={multiFilterSelectData?.stages}
          setFilterParams={(newParams) =>
            setFilterParams({ ...filterParams, stages: newParams })
          }
          handleSetSearchParams={handleSetSearchParams}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      )}
      {props.teams && (
        <ItemFilter<Team>
          filterName="teams"
          labelKey="name"
          selectedItems={filterParams.teams}
          setFilterParams={(newParams) =>
            setFilterParams({ ...filterParams, teams: newParams })
          }
          selectableIds={multiFilterSelectData?.team_ids}
          handleSetSearchParams={handleSetSearchParams}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      )}
      {props.maps && (
        <ItemFilter<Map>
          filterName="maps"
          labelKey="name"
          selectedItems={filterParams.maps}
          setFilterParams={(newParams) =>
            setFilterParams({ ...filterParams, maps: newParams })
          }
          selectableIds={multiFilterSelectData?.map_ids}
          handleSetSearchParams={handleSetSearchParams}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      )}
    </div>
  );
};
