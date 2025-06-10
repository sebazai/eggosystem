"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";
import type { Team } from "@eggosystem/types";

export const useOrganizationTeams = (organizationId?: number) => {
  // FIX: We should not fetch if organizationId === -1
  const shouldFetch = typeof organizationId === "number";

  const { data, error, isValidating, isLoading } = useSWR<Team[], Error>(
    shouldFetch ? `/api/v1/organizations/${organizationId}/teams` : null,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    teams: shouldFetch ? data : null,
    isLoading: shouldFetch ? isLoading : false,
    isError: shouldFetch ? error : null,
    isValidating: shouldFetch ? isValidating : false
  };
};
