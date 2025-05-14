"use client";

import type { Team } from "@eggosystem/types";
import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";

export const useSelectableTeams = () => {
  const { data, error, isLoading, isValidating } = useSWR<Team[]>(
    "/api/v1/dashboard/teams",
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
