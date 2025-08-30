"use client";

import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import { isValidSteamId } from "@/lib/utils";
import type { PlayerValidationResult } from "@eggosystem/types";

export interface UsePlayerValidationReturn {
  validationResult: PlayerValidationResult | null;
  isValidating: boolean;
  error: string | null;
  validatePlayer: (
    steamId: string,
    seasonId: string
  ) => Promise<PlayerValidationResult | undefined>;
  clearResults: () => void;
}

/**
 * Custom hook for validating player data against season requirements.
 * Uses SWR for caching and on-demand validation with manual triggering.
 */
export function usePlayerValidation(): UsePlayerValidationReturn {
  const { data, error, isValidating, mutate } = useSWR<PlayerValidationResult>(
    null, // No automatic fetching - we'll trigger manually
    null,
    {
      revalidateOnFocus: false,
      revalidateOnMount: false,
      revalidateOnReconnect: false
    }
  );

  const validatePlayer = async (
    steamId: string,
    seasonId: string
  ): Promise<PlayerValidationResult | undefined> => {
    // Validate inputs first
    if (!steamId || !seasonId) {
      throw new Error("All fields are required. Please select a season first.");
    }

    if (!isValidSteamId(steamId)) {
      throw new Error("Invalid Steam ID format");
    }

    // Create the API URL
    const apiUrl = `/api/v1/dashboard/players/${steamId}/validate?season_id=${seasonId}`;

    // Use SWR's mutate to fetch data with the constructed URL
    return await mutate(clientApiFetch<PlayerValidationResult>(apiUrl));
  };

  const clearResults = () => {
    mutate(undefined, false); // Clear data without revalidation
  };

  return {
    validationResult: data || null,
    isValidating,
    error: error?.message || null,
    validatePlayer,
    clearResults
  };
}
