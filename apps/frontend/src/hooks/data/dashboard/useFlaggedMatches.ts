"use client";

import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import type { FlaggedMatches } from "@eggosystem/types";

export const useFlaggedMatches = () => {
  const { data, error, isLoading, isValidating } = useSWR<{
    matches: FlaggedMatches[];
  }>("/api/v1/dashboard/matches/flagged", clientApiFetch, {
    revalidateOnFocus: false
  });

  return {
    flaggedMatches: data?.matches,
    isLoading,
    error,
    isValidating
  };
};
