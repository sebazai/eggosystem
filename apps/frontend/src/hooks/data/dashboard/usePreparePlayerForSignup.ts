"use client";

import { useState } from "react";
import { clientApiFetch } from "@/lib/apiClient";
import { convertSteamIdToSteamId64, isValidSteamId } from "@/lib/utils";

interface PreparePlayerForSignupResponse {
  message: string;
  account_id: number;
  steam_id: string;
  changes_made: boolean;
}

interface UsePreparePlayerForSignupReturn {
  isPreparing: boolean;
  error: string | null;
  preparePlayer: (steamId: string) => Promise<PreparePlayerForSignupResponse>;
  clearError: () => void;
}

/**
 * Custom hook for preparing a player for signup by creating/updating account and SteamPlayers profile
 * with fake data. This allows accepting teams from signup drafts when players don't have complete account data.
 */
export function usePreparePlayerForSignup(): UsePreparePlayerForSignupReturn {
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preparePlayer = async (
    steamId: string
  ): Promise<PreparePlayerForSignupResponse> => {
    // Validate input
    if (!steamId) {
      throw new Error("Steam ID is required");
    }

    // Convert Steam ID to SteamID64 format (handles SteamID, SteamID3, URLs, custom URLs)
    const convertedSteamId = await convertSteamIdToSteamId64(steamId);

    if (!isValidSteamId(convertedSteamId)) {
      throw new Error("Invalid Steam ID format");
    }

    // Create the API URL
    const apiUrl = `/api/v1/dashboard/players/${convertedSteamId}/prepare-for-signup`;

    setIsPreparing(true);
    setError(null);

    try {
      const result = await clientApiFetch<PreparePlayerForSignupResponse>(
        apiUrl,
        {
          method: "POST"
        }
      );

      return result;
    } catch (err) {
      console.error("Error in preparePlayer:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to prepare player";
      setError(errorMessage);
      throw err;
    } finally {
      setIsPreparing(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    isPreparing,
    error,
    preparePlayer,
    clearError
  };
}
