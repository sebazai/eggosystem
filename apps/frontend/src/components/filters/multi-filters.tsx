"use client";

import clsx from "clsx";
import { useCallback, useState } from "react";
import { ItemFilter } from "./item-filter";
import type { League, Season, Team, Map } from "@eggosystem/types";
import { StageFilter } from "./stage-filter";
import { useMultiFilterSelectables } from "@/hooks/data/useMultiFilterSelectables";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FilterParamsQuery } from "@/lib/utils";
import { Button } from "../ui/button";

interface MultiFiltersProps extends FilterParamsQuery {
  hideFilters?: {
    seasons?: boolean;
    leagues?: boolean;
    stages?: boolean;
    teams?: boolean;
    maps?: boolean;
  };
}

export const MultiFilters = (props: MultiFiltersProps) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const seasonSorter = useCallback((a: Season, b: Season) => b.id - a.id, []);
  const leagueSorter = useCallback((a: League, b: League) => a.id - b.id, []);
  const teamSorter = useCallback(
    (a: Team, b: Team) => a.name.localeCompare(b.name),
    []
  );

  const { multiFilterSelectData, isValidating } =
    useMultiFilterSelectables(props);

  const handleOpen = (filter: string | null) => {
    if (filter === null) {
      setOpenFilter(null);
      return;
    }
    setOpenFilter((prev: string | null) => (prev === filter ? null : filter));
  };

  const handleSetSearchParams = (key: string, values: number[]) => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete(key);
    values.forEach((v) => params.append(key, v.toString()));
    const newUrl = `${pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
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
      {props.seasons && !props.hideFilters?.seasons && (
        <ItemFilter<Season>
          filterName="seasons"
          labelKey="full_name"
          selectedItems={props.seasons}
          selectableIds={multiFilterSelectData?.season_ids}
          isValidating={isValidating}
          handleSetSearchParams={handleSetSearchParams}
          openFilter={openFilter}
          handleOpen={handleOpen}
          sorter={seasonSorter}
        />
      )}
      {props.leagues && !props.hideFilters?.leagues && (
        <ItemFilter<League>
          filterName="leagues"
          labelKey="name"
          selectedItems={props.leagues}
          selectableIds={multiFilterSelectData?.league_ids}
          isValidating={isValidating}
          handleSetSearchParams={handleSetSearchParams}
          openFilter={openFilter}
          handleOpen={handleOpen}
          sorter={leagueSorter}
        />
      )}
      {props.stages && !props.hideFilters?.stages && (
        <StageFilter
          selectedStages={props.stages}
          selectableStages={multiFilterSelectData?.stages}
          isValidating={isValidating}
          handleSetSearchParams={handleSetSearchParams}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      )}
      {props.teams && !props.hideFilters?.teams && (
        <ItemFilter<Team>
          filterName="teams"
          labelKey="name"
          selectedItems={props.teams}
          selectableIds={multiFilterSelectData?.team_ids}
          isValidating={isValidating}
          handleSetSearchParams={handleSetSearchParams}
          openFilter={openFilter}
          handleOpen={handleOpen}
          sorter={teamSorter}
        />
      )}
      {props.maps && !props.hideFilters?.maps && (
        <ItemFilter<Map>
          filterName="maps"
          labelKey="name"
          selectedItems={props.maps}
          selectableIds={multiFilterSelectData?.map_ids}
          isValidating={isValidating}
          handleSetSearchParams={handleSetSearchParams}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      )}
      <Button
        variant={"secondary"}
        onClick={() => {
          router.replace(pathname);
        }}
      >
        Clear all filters
      </Button>
    </div>
  );
};
