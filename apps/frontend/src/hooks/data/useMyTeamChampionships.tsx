"use client";

import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";

interface Championship {
  id: number;
  external_id: string;
  external_league_name: string;
  type: string;
  stage_name: string;
}

export const useMyTeamChampionships = (seasonId: number, leagueId: number) => {
  const { data, error, isLoading, isValidating } = useSWR<
    { championships: Championship[] },
    Error
  >(`/api/v1/my-teams/championships/${seasonId}/${leagueId}`, clientApiFetch, {
    revalidateOnFocus: false
  });

  return {
    championships: data?.championships ?? [],
    isLoading,
    isError: error,
    isValidating
  };
};
