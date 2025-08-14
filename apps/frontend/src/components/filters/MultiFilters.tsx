"use client";

import clsx from "clsx";
import { useState } from "react";
import { ItemFilter } from "./ItemFilter";
import type {
  League,
  Season,
  Team,
  Map,
  MultiFilterSelectableIds,
  Stage
} from "@eggosystem/types";
import { useMultiFilterSelectables } from "@/hooks/data/useMultiFilterSelectables";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FilterParamsQuery } from "@/lib/utils";
import { Button } from "../ui/button";

type FilterParamQueryKeys = Exclude<keyof FilterParamsQuery, "steamId">;

interface MultiFiltersProps extends FilterParamsQuery {
  hideFilters?: {
    seasons?: boolean;
    leagues?: boolean;
    stages?: boolean;
    teams?: boolean;
    maps?: boolean;
  };
  sortOrder?: FilterParamQueryKeys[];
}

const keyToMultiFilterSelectData: Record<
  FilterParamQueryKeys,
  keyof MultiFilterSelectableIds
> = {
  seasons: "season_ids",
  leagues: "league_ids",
  stages: "stages",
  teams: "team_ids",
  maps: "map_ids"
};

const getFilterComponent = (
  key: FilterParamQueryKeys,
  selectedItems: number[],
  selectableIds: number[] | undefined,
  isValidating: boolean,
  handleSetSearchParams: (key: string, values: number[]) => void,
  openFilter: string | null,
  handleOpen: (filter: string | null) => void
) => {
  switch (key) {
    case "stages":
      return (
        <ItemFilter<Stage>
          key={key}
          filterName="stages"
          labelKey="name"
          selectedItems={selectedItems}
          selectableIds={selectableIds}
          isValidating={isValidating}
          handleSetSearchParams={handleSetSearchParams}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      );
    case "seasons":
      return (
        <ItemFilter<Season>
          key={key}
          filterName="seasons"
          labelKey="full_name"
          selectedItems={selectedItems}
          selectableIds={selectableIds}
          isValidating={isValidating}
          handleSetSearchParams={handleSetSearchParams}
          openFilter={openFilter}
          handleOpen={handleOpen}
          sorter={(a: Season, b: Season) => b.id - a.id}
        />
      );
    case "leagues":
      return (
        <ItemFilter<League>
          key={key}
          filterName="leagues"
          labelKey="name"
          selectedItems={selectedItems}
          selectableIds={selectableIds}
          isValidating={isValidating}
          handleSetSearchParams={handleSetSearchParams}
          openFilter={openFilter}
          handleOpen={handleOpen}
          sorter={(a: League, b: League) => a.sort_priority - b.sort_priority}
        />
      );
    case "teams":
      return (
        <ItemFilter<Team>
          key={key}
          filterName="teams"
          labelKey="name"
          selectedItems={selectedItems}
          selectableIds={selectableIds}
          isValidating={isValidating}
          handleSetSearchParams={handleSetSearchParams}
          openFilter={openFilter}
          handleOpen={handleOpen}
          sorter={(a: Team, b: Team) => a.name.localeCompare(b.name)}
        />
      );
    case "maps":
      return (
        <ItemFilter<Map>
          key={key}
          filterName="maps"
          labelKey="name"
          selectedItems={selectedItems}
          selectableIds={selectableIds}
          isValidating={isValidating}
          handleSetSearchParams={handleSetSearchParams}
          openFilter={openFilter}
          handleOpen={handleOpen}
        />
      );
    default:
      return null;
  }
};

export const MultiFilters = ({
  sortOrder = ["seasons", "leagues", "stages", "teams", "maps"],
  hideFilters,
  ...props
}: MultiFiltersProps) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [openFilter, setOpenFilter] = useState<string | null>(null);

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

  // Filter out hidden filters from sortOrder
  const visibleFilters = sortOrder.filter((key) => {
    if (!hideFilters) return true;

    switch (key) {
      case "seasons":
        return !hideFilters.seasons;
      case "leagues":
        return !hideFilters.leagues;
      case "stages":
        return !hideFilters.stages;
      case "teams":
        return !hideFilters.teams;
      case "maps":
        return !hideFilters.maps;
      default:
        return true;
    }
  });

  // How many visible filters are there, + 1 for the clear filters button
  const columns = Math.round(visibleFilters.length / 2) + 1;
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
      {visibleFilters.map((key) => {
        return getFilterComponent(
          key,
          props[key] ?? [],
          multiFilterSelectData?.[keyToMultiFilterSelectData[key]],
          isValidating,
          handleSetSearchParams,
          openFilter,
          handleOpen
        );
      })}
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
