"use client";

import { clientApiFetch } from "@/lib/apiClient";
import type { TeamEligibilityResult } from "@eggosystem/types";
import useSWR from "swr";

export const usePlayerEligibility = (
  seasonId: string | null,
  teamId: string | null,
  steamId: string | null
) => {
  // Only create the key if all required parameters are present
  const key =
    seasonId && teamId && steamId
      ? `/api/v1/dashboard/sortter/season/${seasonId}/team/${teamId}/player/${steamId}/eligibility`
      : null;

  const { data, error, isValidating, isLoading, mutate } =
    useSWR<TeamEligibilityResult>(key, clientApiFetch, {
      revalidateOnFocus: false,
      // Don't fetch automatically - we'll trigger with mutate
      revalidateOnMount: false,
      revalidateOnReconnect: false
    });

  const checkEligibility = async () => {
    if (!key) {
      throw new Error("Please select a season, team and enter a Steam ID");
    }

    // Use mutate to trigger the fetch
    return await mutate();
  };

  const clearResult = () => {
    mutate(undefined, false); // Clear data without revalidation
  };

  return {
    eligibilityResult: data,
    isLoading: isValidating || isLoading,
    isError: error,
    checkEligibility,
    clearResult
  };
};
