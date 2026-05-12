"use client";

import { useState } from "react";
import { clientApiFetch } from "@/lib/apiClient";
import { isValidSteamId, convertSteamIdToSteamId64 } from "@/lib/utils";
import type { PlayerValidationResult } from "@eggosystem/types";

interface UsePlayerValidationReturn {
  validationResult: PlayerValidationResult | null;
  isValidating: boolean;
  error: string | null;
  validatePlayer: (
    steamId: string,
    seasonId: string
  ) => Promise<PlayerValidationResult>;
  clearResults: () => void;
}

/**
 * Custom hook for validating player data against season requirements.
 * Uses direct API calls without caching for one-time validation.
 */
export function usePlayerValidation(): UsePlayerValidationReturn {
  const [validationResult, setValidationResult] =
    useState<PlayerValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePlayer = async (
    steamId: string,
    seasonId: string
  ): Promise<PlayerValidationResult> => {
    // Validate inputs first
    if (!steamId || !seasonId) {
      throw new Error("All fields are required. Please select a season first.");
    }

    // Convert Steam ID to SteamID64 format (handles SteamID, SteamID3, URLs, custom URLs)
    const convertedSteamId = await convertSteamIdToSteamId64(steamId);

    if (!isValidSteamId(convertedSteamId)) {
      throw new Error("Invalid Steam ID format");
    }

    // Create the API URL
    const apiUrl = `/api/v1/dashboard/players/${convertedSteamId}/validate?season_id=${seasonId}`;

    setIsValidating(true);
    setError(null);

    try {
      const result = await clientApiFetch<PlayerValidationResult>(apiUrl);

      setValidationResult(result);
      return result;
    } catch (err) {
      console.error("Error in validatePlayer:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Validation failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsValidating(false);
    }
  };

  const clearResults = () => {
    setValidationResult(null);
    setError(null);
  };

  return {
    validationResult,
    isValidating,
    error,
    validatePlayer,
    clearResults
  };
}
