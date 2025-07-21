"use client";

import type { SeasonRegisteredTeamsWithPlayersValidatedTeams } from "@eggosystem/types";
import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";

export const useRegisteredTeams = () => {
  const { data, error, isLoading, isValidating } = useSWR<
    SeasonRegisteredTeamsWithPlayersValidatedTeams[]
  >("/api/v1/dashboard/registration/registered", clientApiFetch, {
    revalidateOnFocus: false
  });

  return {
    registeredTeams: data,
    isLoading,
    error,
    isValidating
  };
};
