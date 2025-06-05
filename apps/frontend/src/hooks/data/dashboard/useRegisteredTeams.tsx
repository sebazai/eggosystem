"use client";

import type { SeasonRegisteredTeamsWithPlayers } from "@eggosystem/types";
import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";

export const useRegisteredTeams = () => {
  const { data, error, isLoading, isValidating } = useSWR<
    SeasonRegisteredTeamsWithPlayers[]
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
