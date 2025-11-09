"use client";

import useSWR from "swr";
import type { MyTeamUpcomingMatch } from "@eggosystem/types";
import { clientApiFetch } from "@/lib/apiClient";

export const useMyTeamsUpcomingMatches = () => {
  const { data, error, isLoading, mutate } = useSWR<
    { matches: MyTeamUpcomingMatch[] },
    Error
  >(`/api/v1/accounts/my-teams/upcoming-matches`, clientApiFetch, {
    revalidateOnFocus: false
  });

  return {
    matches: data?.matches ?? [],
    isLoading,
    isError: error,
    mutate
  };
};
