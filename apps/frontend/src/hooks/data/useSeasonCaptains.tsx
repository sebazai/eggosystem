"use client";

import { clientApiFetch } from "@/lib/apiClient";
import type { TeamCaptain } from "@eggosystem/types";
import useSWR from "swr";

export const useSeasonCaptains = (seasonId: string) => {
  const { data, error, isValidating, isLoading } = useSWR<TeamCaptain[], Error>(
    `/api/v1/seasons/${seasonId}/captains`,
    clientApiFetch,
    { revalidateOnFocus: false }
  );

  return {
    captains: data,
    isLoading,
    isError: error,
    isValidating
  };
};
