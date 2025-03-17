"use client";

import { fetcher } from "@/lib/utils";
import useSWR from "swr";
import type { Team } from "@eggosystem/types";

export const useOrganizationTeams = (organizationId?: number) => {
  const { data, error, isValidating } = useSWR<Team[], Error>(
    `/api/organizations/${organizationId}/teams`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    teams: data,
    isLoading: !data && !error, // When there is no data and no error, it's loading
    isError: error,
    isValidating
  };
};
