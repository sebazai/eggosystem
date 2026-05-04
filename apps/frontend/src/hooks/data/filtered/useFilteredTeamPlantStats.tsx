"use client";

import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";
import { generateFiltersParamQuery } from "@/lib/utils";
import type { TeamPlantStat } from "@eggosystem/types";
import type { FilterParamsQuery } from "@/lib/utils";

interface UseFilteredTeamPlantStatsProps {
  teamId: number;
  filterQueryParams: FilterParamsQuery;
}

interface PlantStatsResponse {
  success: boolean;
  data: TeamPlantStat[];
}

export const useFilteredTeamPlantStats = ({
  teamId,
  filterQueryParams
}: UseFilteredTeamPlantStatsProps) => {
  const sortedQuery = generateFiltersParamQuery(filterQueryParams);

  const { data, error, isValidating, isLoading } = useSWR<PlantStatsResponse>(
    `/api/v1/filters/teams/${teamId}/stats/plants?${sortedQuery}`,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    teamPlantStats: data?.data || [],
    isLoading,
    error,
    isValidating
  };
};
