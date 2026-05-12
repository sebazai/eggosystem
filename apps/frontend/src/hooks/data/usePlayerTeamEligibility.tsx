"use client";

import { useState, useCallback } from "react";
import { clientApiFetch } from "@/lib/apiClient";
import type { TeamEligibilityResult } from "@eggosystem/types";
import useSWR from "swr";

export const usePlayerTeamEligibility = (
  seasonId: string | null,
  teamId: string | null,
  steamId: string | null,
  excludeSteamId?: string | null
) => {
  // Only create the key if all required parameters are present
  const baseUrl =
    seasonId && teamId && steamId
      ? `/api/v1/dashboard/seasons/${seasonId}/team/${teamId}/player/${steamId}/eligibility`
      : null;

  // Add excludeSteamId as query parameter if provided
  const key =
    baseUrl && excludeSteamId
      ? `${baseUrl}?excludeSteamId=${excludeSteamId}`
      : baseUrl;

  const [isChecking, setIsChecking] = useState(false);
  const [fetchError, setFetchError] = useState<Error | null>(null);

  // Fetcher is never run (revalidateOnMount: false); we fetch in checkEligibility and mutate() the result.
  const dummyFetcher = (): Promise<TeamEligibilityResult> =>
    new Promise(() => {});

  const { data, mutate } = useSWR<TeamEligibilityResult>(
    key ?? undefined,
    key ? dummyFetcher : null,
    {
      revalidateOnFocus: false,
      revalidateOnMount: false,
      revalidateOnReconnect: false,
      keepPreviousData: false
    }
  );

  const checkEligibility = useCallback(async () => {
    if (!key) {
      throw new Error("Please select a season, team and enter a Steam ID");
    }

    setIsChecking(true);
    setFetchError(null);
    try {
      const result = await clientApiFetch<TeamEligibilityResult>(key);
      await mutate(result, { revalidate: false });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setFetchError(error);
      throw error;
    } finally {
      setIsChecking(false);
    }
  }, [key, mutate]);

  const clearResult = useCallback(() => {
    setFetchError(null);
    mutate(undefined, { revalidate: false });
  }, [mutate]);

  return {
    eligibilityResult: data,
    isLoading: isChecking,
    isError: fetchError,
    checkEligibility,
    clearResult
  };
};
