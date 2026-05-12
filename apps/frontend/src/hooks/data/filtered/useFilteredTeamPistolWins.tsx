"use client";

import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";
import { generateFiltersParamQuery } from "@/lib/utils";
import type { TeamPistolWinStat } from "@eggosystem/types";
import type { FilterParamsQuery } from "@/lib/utils";

interface UseFilteredTeamPistolWinsProps {
  teamId: number;
  filterQueryParams: FilterParamsQuery;
}

interface PistolWinsResponse {
  success: boolean;
  data: TeamPistolWinStat[];
}

export const useFilteredTeamPistolWins = ({
  teamId,
  filterQueryParams
}: UseFilteredTeamPistolWinsProps) => {
  const sortedQuery = generateFiltersParamQuery(filterQueryParams);

  const { data, error, isValidating, isLoading } = useSWR<PistolWinsResponse>(
    `/api/v1/filters/teams/${teamId}/stats/pistol-wins?${sortedQuery}`,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    teamPistolWins: data?.data || [],
    isLoading,
    error,
    isValidating
  };
};
