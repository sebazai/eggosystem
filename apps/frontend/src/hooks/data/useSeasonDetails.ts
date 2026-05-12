"use client";

import useSWR from "swr";
import type { SeasonDetails } from "@eggosystem/types";
import { clientApiFetch } from "@/lib/apiClient";

interface UseSeasonDetailsResult {
  seasonDetails: SeasonDetails | null;
  isLoading: boolean;
  isError: Error | null;
  isValidating: boolean;
}

export const useSeasonDetails = (
  seasonId: string | number
): UseSeasonDetailsResult => {
  const key = seasonId
    ? (`/api/v1/seasons/${seasonId}/details` as const)
    : null;

  const { data, error, isLoading, isValidating } = useSWR<SeasonDetails, Error>(
    key,
    clientApiFetch,
    {
      revalidateOnFocus: false
    }
  );

  return {
    seasonDetails: data ?? null,
    isLoading: Boolean(key && isLoading),
    isError: error ?? null,
    isValidating
  };
};
