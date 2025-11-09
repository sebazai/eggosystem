"use client";

import useSWR from "swr";
import type { MyTeamDetails } from "@eggosystem/types";
import { clientApiFetch } from "@/lib/apiClient";

export const useMyTeams = () => {
  const { data, error, isLoading, mutate } = useSWR<
    { teams: MyTeamDetails[] },
    Error
  >(`/api/v1/accounts/my-teams`, clientApiFetch, {
    revalidateOnFocus: false
  });

  return {
    teams: data?.teams ?? [],
    isLoading,
    isError: error,
    mutate
  };
};
