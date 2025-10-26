"use client";

import useSWR from "swr";
import { envConfig } from "@/configs/env";
import type { MultiFilterSelectableIds } from "@eggosystem/types";
import type { FilterParamsQuery } from "@/lib/utils";

/**
 * Fetches available filter options based on currently selected filters.
 * The backend performs SQL-based intersection logic to return only valid options
 * for each filter dimension given the other selected filters.
 */
const fetchMultiFilterData = async (
  params: FilterParamsQuery
): Promise<MultiFilterSelectableIds> => {
  const urlParams = new URLSearchParams();

  // Add all filter parameters to the request
  if (params.seasons?.length) {
    params.seasons.forEach((id) => urlParams.append("season_ids", String(id)));
  }
  if (params.leagues?.length) {
    params.leagues.forEach((id) => urlParams.append("league_ids", String(id)));
  }
  if (params.stages?.length) {
    params.stages.forEach((id) => urlParams.append("stages", String(id)));
  }
  if (params.teams?.length) {
    params.teams.forEach((id) => urlParams.append("team_ids", String(id)));
  }
  if (params.maps?.length) {
    params.maps.forEach((id) => urlParams.append("map_ids", String(id)));
  }
  if (params.steamId) {
    urlParams.append("steamId", params.steamId);
  }
  if (params.player_name) {
    urlParams.append("player_name", params.player_name);
  }

  const queryString = urlParams.toString();
  const url = `${envConfig.API_URL}/api/v1/filters${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch filter data");

  return res.json();
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
