"use client";

import { clientApiFetch } from "@/lib/apiClient";
import useSWR from "swr";
import type { Team } from "@eggosystem/types";

export function useTeam(teamId: string) {
  const { data, error, isLoading, isValidating } = useSWR<Team>(
    `/api/v1/dashboard/teams/${teamId}`,
    clientApiFetch,
    {
      revalidateOnFocus: false
    }
  );

  return {
    team: data || null,
    isLoading,
    isError: error,
    isValidating
  };
}
