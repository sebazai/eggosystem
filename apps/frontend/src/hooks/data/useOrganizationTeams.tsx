"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";
import type { Team } from "@eggosystem/types";

export const useOrganizationTeams = (organizationId: number) => {
  const { data, error, isValidating } = useSWR<Team[], Error>(
    `/api/v1/organizations/${organizationId}/teams`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    teams: data,
    isLoading: !data && !error, // When there is no data and no error, it's loading
    isError: error,
    isValidating
  };
};
