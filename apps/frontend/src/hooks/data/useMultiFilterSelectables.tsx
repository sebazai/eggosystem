"use client";

import useSWR from "swr";
import _ from "lodash";
import { envConfig } from "@/configs/env";
import type { MultiFilterSelectableIds } from "@eggosystem/types";
import type { FilterParamsQuery } from "@/lib/utils";

const fetchPossibleIdsWithIndividualParam = async (
  ids: string[],
  key: string,
  steamId?: string
) => {
  const params = new URLSearchParams();
  ids.forEach((id) => params.append(key, id));
  if (steamId) {
    params.append("steamId", steamId);
  }
  const queryString = params.toString();

  const res = await fetch(`${envConfig.API_URL}/api/v1/filters?${queryString}`);
  if (!res.ok) throw new Error("Failed to fetch filter data");

  return res.json();
};

const fetchPossibleIdsWithCombinedParam = async (
  queryParams: Array<{ key: string; values: string[] }>,
  steamId?: string
) => {
  const params = new URLSearchParams();
  queryParams.forEach((param) => {
    param.values.forEach((value) => {
      params.append(param.key, value);
    });
  });

  if (steamId) {
    params.append("steamId", steamId);
  }

  const queryString = params.toString();

  const res = await fetch(`${envConfig.API_URL}/api/v1/filters?${queryString}`);
  if (!res.ok) throw new Error("Failed to fetch filter data");

  return res.json();
};

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

  const [
    withSeasonsParam,
    withLeaguesParam,
    withStagesParam,
    withTeamsParam,
    withMapsParam,
    withCombinedParam
  ] = await Promise.all([
    fetchPossibleIdsWithIndividualParam(
      seasons ?? [],
      "season_ids",
      params.steamId
    ),
    fetchPossibleIdsWithIndividualParam(
      leagues ?? [],
      "league_ids",
      params.steamId
    ),
    fetchPossibleIdsWithIndividualParam(
      stages ?? [],
      "stage_ids",
      params.steamId
    ),
    fetchPossibleIdsWithIndividualParam(
      teams ?? [],
      "team_ids",
      params.steamId
    ),
    fetchPossibleIdsWithIndividualParam(maps ?? [], "map_ids", params.steamId),
    fetchPossibleIdsWithCombinedParam(
      [
        { key: "season_ids", values: seasons ?? [] },
        { key: "team_ids", values: teams ?? [] }
      ],
      params.steamId
    )
  ]);

  return {
    season_ids: _.intersection(
      withLeaguesParam.season_ids,
      withStagesParam.season_ids,
      withTeamsParam.season_ids,
      withMapsParam.season_ids
    ),
    league_ids: _.intersection(
      withSeasonsParam.league_ids,
      withStagesParam.league_ids,
      withTeamsParam.league_ids,
      withMapsParam.league_ids,
      withCombinedParam.league_ids
    ),
    stages: _.intersection(
      withSeasonsParam.stages,
      withLeaguesParam.stages,
      withTeamsParam.stages,
      withMapsParam.stages
    ),
    team_ids: _.intersection(
      withSeasonsParam.team_ids,
      withLeaguesParam.team_ids,
      withStagesParam.team_ids,
      withMapsParam.team_ids
    ),
    map_ids: _.intersection(
      withSeasonsParam.map_ids,
      withLeaguesParam.map_ids,
      withStagesParam.map_ids,
      withTeamsParam.map_ids
    )
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
