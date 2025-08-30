"use client";

import { useState, useCallback } from "react";
import { clientApiFetch } from "@/lib/apiClient";
import { isValidSteamId } from "@/lib/utils";
import type { PlayerValidationResult } from "@eggosystem/types";

export interface UsePlayerValidationReturn {
  validationResult: PlayerValidationResult | null;
  isValidating: boolean;
  error: string | null;
  validatePlayer: (steamId: string, seasonId: string) => Promise<void>;
  clearResults: () => void;
}

/**
 * Custom hook for validating player data against season requirements.
 * Uses manual triggering pattern similar to useAddPlayer for on-demand validation.
 */
export function usePlayerValidation(): UsePlayerValidationReturn {
  const [validationResult, setValidationResult] =
    useState<PlayerValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePlayer = useCallback(
    async (steamId: string, seasonId: string) => {
      // Clear previous results
      setValidationResult(null);
      setError(null);

      // Validate inputs
      if (!steamId || !seasonId) {
        setError("All fields are required. Please select a season first.");
        return;
      }

      if (!isValidSteamId(steamId)) {
        setError("Invalid Steam ID format");
        return;
      }

      setIsValidating(true);

      try {
        const result = await clientApiFetch<PlayerValidationResult>(
          `/api/v1/dashboard/players/${steamId}/validate?season_id=${seasonId}`
        );
        setValidationResult(result);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to validate player";
        setError(errorMessage);
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  const clearResults = useCallback(() => {
    setValidationResult(null);
    setError(null);
  }, []);

  return {
    validationResult,
    isValidating,
    error,
    validatePlayer,
    clearResults
  };
}
