"use client";

import useSWR from "swr";
import { envConfig } from "@/configs/env";
import type { MultiFilterSelectableIds } from "@eggosystem/types";
import type { FilterParamsQuery } from "@/lib/utils";

const fetchMultiFilterData = async (
  params: FilterParamsQuery
): Promise<MultiFilterSelectableIds> => {
  const [seasons, leagues, stages, teams, maps] = [
    params.seasons ?? [],
    params.leagues ?? [],
    params.stages ?? [],
    params.teams ?? [],
    params.maps ?? []
  ].map((arr) => arr.map(String)); // stringify for URL usage

  // Build URL with all current filter parameters
  const urlParams = new URLSearchParams();

  // Add filter parameters
  seasons?.forEach((id) => urlParams.append("season_ids", id));
  leagues?.forEach((id) => urlParams.append("league_ids", id));
  stages?.forEach((id) => urlParams.append("stages", id));
  teams?.forEach((id) => urlParams.append("team_ids", id));
  maps?.forEach((id) => urlParams.append("map_ids", id));

  if (params.steamId) {
    urlParams.append("steamId", params.steamId);
  }

  // Request all filter types in a single call
  urlParams.append("types", "season_ids,team_ids,league_ids,stages,map_ids");

  const queryString = urlParams.toString();
  const res = await fetch(`${envConfig.API_URL}/api/v1/filters?${queryString}`);

  if (!res.ok) throw new Error("Failed to fetch filter data");

  const data = await res.json();

  // Return the data directly - no need for complex intersections
  // The backend now handles the filtering logic
  return {
    season_ids: data.season_ids ?? [],
    league_ids: data.league_ids ?? [],
    stages: data.stages ?? [],
    team_ids: data.team_ids ?? [],
    map_ids: data.map_ids ?? []
  };
};

export const useMultiFilterSelectables = (params: FilterParamsQuery) => {
  const { data, error, isValidating, isLoading } = useSWR(
    ["multi-filters", params],
    () => fetchMultiFilterData(params),
    {
      revalidateOnFocus: false,
      keepPreviousData: true
    }
  );

  return {
    multiFilterSelectData: data,
    isError: error,
    isLoading,
    isValidating
  };
};
