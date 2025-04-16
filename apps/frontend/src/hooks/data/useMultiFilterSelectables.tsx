"use client";

import useSWR from "swr";
import _ from "lodash";
import { envConfig } from "@/configs/env";
import type { MultiFilterSelectableIds, Nullable } from "@eggosystem/types";

interface UseMultiFilterSelectablesProps {
  seasons: Nullable<number[]>;
  leagues: Nullable<number[]>;
  stages: Nullable<number[]>;
  teams: Nullable<number[]>;
  maps: Nullable<number[]>;
}

const fetchPossibleIdsWithIndividualParam = async (
  ids: (string | number)[],
  key: string
) => {
  const params = new URLSearchParams();
  ids.forEach((id) => params.append(key, String(id)));
  const queryString = params.toString();

  const res = await fetch(`${envConfig.API_URL}/api/v1/filters?${queryString}`);
  if (!res.ok) throw new Error("Failed to fetch filter data");

  return res.json();
};

const fetchMultiFilterData = async (
  params: UseMultiFilterSelectablesProps
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
    withMapsParam
  ] = await Promise.all([
    fetchPossibleIdsWithIndividualParam(seasons ?? [], "season_ids"),
    fetchPossibleIdsWithIndividualParam(leagues ?? [], "league_ids"),
    fetchPossibleIdsWithIndividualParam(stages ?? [], "stage_ids"),
    fetchPossibleIdsWithIndividualParam(teams ?? [], "team_ids"),
    fetchPossibleIdsWithIndividualParam(maps ?? [], "map_ids")
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
      withMapsParam.league_ids
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

export const useMultiFilterSelectables = (
  params: UseMultiFilterSelectablesProps
) => {
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
