"use client";

import { useState } from "react";
import { clientApiFetch } from "@/lib/apiClient";
import type {
  EmailVerificationLookupResult,
  EmailVerificationRegenerateResponse
} from "@eggosystem/types";

type LookupType = "steam_id" | "account_id" | "nickname" | "email";

export interface UseLookupAccountReturn {
  accountData: EmailVerificationLookupResult | null;
  isLoading: boolean;
  error: string | null;
  lookupAccount: (value: string, type: LookupType) => Promise<void>;
  clearResults: () => void;
}

/**
 * Hook for looking up accounts by various methods
 */
export function useLookupAccount(): UseLookupAccountReturn {
  const [accountData, setAccountData] =
    useState<EmailVerificationLookupResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupAccount = async (value: string, type: LookupType) => {
    if (!value || !type) {
      setError("Please provide both a lookup value and type");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAccountData(null);

    try {
      const apiUrl = `/api/v1/dashboard/email-verification/lookup?lookup=${encodeURIComponent(value)}&lookupType=${type}`;
      const result =
        await clientApiFetch<EmailVerificationLookupResult>(apiUrl);

      setAccountData(result);
    } catch (err) {
      console.error("Error in lookupAccount:", err);
      const errorMessage = err instanceof Error ? err.message : "Lookup failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setAccountData(null);
    setError(null);
  };

  return {
    accountData,
    isLoading,
    error,
    lookupAccount,
    clearResults
  };
}

export interface UseRegenerateTokenReturn {
  regeneratedData: EmailVerificationRegenerateResponse | null;
  isRegenerating: boolean;
  error: string | null;
  regenerateToken: (accountId: number) => Promise<void>;
  clearRegeneratedData: () => void;
}

/**
 * Hook for regenerating verification tokens
 */
export function useRegenerateToken(): UseRegenerateTokenReturn {
  const [regeneratedData, setRegeneratedData] =
    useState<EmailVerificationRegenerateResponse | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regenerateToken = async (accountId: number) => {
    if (!accountId) {
      setError("Account ID is required");
      return;
    }

    setIsRegenerating(true);
    setError(null);
    setRegeneratedData(null);

    try {
      const apiUrl = "/api/v1/dashboard/email-verification/regenerate";
      const result = await clientApiFetch<EmailVerificationRegenerateResponse>(
        apiUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ accountId })
        }
      );

      setRegeneratedData(result);
    } catch (err) {
      console.error("Error in regenerateToken:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Token regeneration failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsRegenerating(false);
    }
  };

  const clearRegeneratedData = () => {
    setRegeneratedData(null);
    setError(null);
  };

  return {
    regeneratedData,
    isRegenerating,
    error,
    regenerateToken,
    clearRegeneratedData
  };
}
