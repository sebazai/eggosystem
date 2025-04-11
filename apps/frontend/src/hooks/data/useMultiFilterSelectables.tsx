"use client";

import useSWR from "swr";
import type { MultiFilterSelectableIds, Nullable } from "@eggosystem/types";
import { generateFiltersParamQuery, nextFetcher } from "@/lib/utils";

interface UseMultiFilterSelectablesProps {
  seasons: Nullable<number[]>;
  leagues: Nullable<number[]>;
  stages: Nullable<number[]>;
  teams: Nullable<number[]>;
  maps: Nullable<number[]>;
}

export const useMultiFilterSelectables = (
  params: UseMultiFilterSelectablesProps
) => {
  const sortedQuery = generateFiltersParamQuery(params);

  const { data, error, isValidating } = useSWR<MultiFilterSelectableIds>(
    `/api/filters?${sortedQuery}`,
    nextFetcher,
    { revalidateOnFocus: false }
  );

  return {
    filterData: data,
    isLoading: !data && !error,
    isError: error,
    isValidating
  };
};
