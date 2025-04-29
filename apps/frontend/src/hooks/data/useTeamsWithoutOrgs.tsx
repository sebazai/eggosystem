"use client";

import type { Team } from "@eggosystem/types";
import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";

export const useTeamsWithoutOrgs = (shouldFetch: boolean) => {
  const { data, error, isLoading, isValidating } = useSWR<Team[]>(
    shouldFetch ? "/api/v1/teams/org-missing" : null,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    teamsWithoutOrgs: data,
    isLoading,
    error,
    isValidating
  };
};
