"use client";

import useSWR from "swr";
import type { MyTeamUpcomingMatch } from "@eggosystem/types";
import { clientApiFetch } from "@/lib/apiClient";

export const useMyTeamsUpcomingMatches = (steamIds?: string[]) => {
  const queryParam = steamIds?.length ? `?steam_ids=${steamIds.join(",")}` : "";

  const { data, error, isLoading } = useSWR<
    { matches: MyTeamUpcomingMatch[] },
    Error
  >(`/api/v1/accounts/my-teams/upcoming-matches${queryParam}`, clientApiFetch, {
    revalidateOnFocus: false
  });

  return {
    matches: data?.matches ?? [],
    isLoading,
    isError: error
  };
};
