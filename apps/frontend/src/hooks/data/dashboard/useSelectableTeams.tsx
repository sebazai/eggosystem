"use client";

import { CREATE_NEW_VALUE, type Team } from "@eggosystem/types";
import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";

export const useSelectableTeams = (organizationId?: string) => {
  const { data, error, isLoading, isValidating } = useSWR<Team[]>(
    organizationId && organizationId !== CREATE_NEW_VALUE
      ? `/api/v1/dashboard/organizations/${organizationId}/teams`
      : "/api/v1/dashboard/teams",
    clientApiFetch,
    {
      revalidateOnFocus: false
    }
  );

  if (!data) {
    return { teams: data, isLoading, error, isValidating };
  }

  const selectableTeams = data
    .map((team) => ({
      id: team.id,
      name: team.name
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    teams: selectableTeams,
    isLoading,
    error,
    isValidating
  };
};
