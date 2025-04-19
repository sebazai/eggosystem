"use client";

import type { TeamDetails } from "@eggosystem/types";
import useSWR from "swr";
import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";

interface UseTeamDetailsProps {
  teamId: number | string;
  maps: FilterParamsQuery["maps"];
}

export const useTeamDetails = ({ teamId, maps }: UseTeamDetailsProps) => {
  const sortedQuery = generateFiltersParamQuery({
    maps,
    seasons: null,
    leagues: null,
    stages: null,
    teams: null
  });

  const { data, error, isValidating, isLoading } = useSWR<TeamDetails>(
    `/api/v1/teams/${teamId}?${sortedQuery}`,
    expressFetcher,
    {
      revalidateOnFocus: false,
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        if (retryCount >= 3) return;
        setTimeout(() => revalidate({ retryCount }), 3000);
      }
    }
  );

  return {
    teamDetails: data,
    isLoading,
    error,
    isValidating
  };
};
