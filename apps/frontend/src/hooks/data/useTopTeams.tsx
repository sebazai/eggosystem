"use client";

import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";
import type {
  TopTeamsByFilters,
  TopTeamsByFiltersRaw
} from "@eggosystem/types";
import useSWR from "swr";

export const useTopTeams = (params: FilterParamsQuery) => {
  const sortedQuery = generateFiltersParamQuery(params);

  const { data, error, isValidating } = useSWR<TopTeamsByFiltersRaw[]>(
    `/api/v1/teams/topteams?${sortedQuery}`,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  if (!data) {
    return {
      divisions: undefined,
      isLoading: !error && !data,
      isValidating,
      isError: error
    };
  }

  const parsedData = data.map((item) => {
    return {
      ...item,
      teams: JSON.parse(item.teams) as TopTeamsByFilters["teams"]
    } satisfies TopTeamsByFilters;
  });

  return {
    divisions: parsedData satisfies TopTeamsByFilters[],
    isLoading: !parsedData && !error,
    isError: error,
    isValidating
  };
};
