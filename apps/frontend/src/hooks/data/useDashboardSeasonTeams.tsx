"use client";

import { clientApiFetch } from "@/lib/apiClient";
import useSWR from "swr";
import type { DashboardSeasonTeam } from "@eggosystem/types";

export const useDashboardSeasonTeams = (seasonId: string | number | null) => {
  const apiUrl = seasonId
    ? `/api/v1/dashboard/seasons/${seasonId}/teams`
    : null;

  const { data, error, isValidating, isLoading } = useSWR<
    DashboardSeasonTeam[]
  >(apiUrl, clientApiFetch, {
    revalidateOnFocus: false
  });

  return {
    teams: data,
    isLoading,
    isError: error,
    isValidating
  };
};
