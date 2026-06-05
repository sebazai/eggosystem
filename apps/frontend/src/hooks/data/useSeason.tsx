"use client";

import { clientApiFetch } from "@/lib/apiClient";
import type { SeasonWithSettings } from "@eggosystem/types";
import useSWR from "swr";

export const useSeason = (seasonId: number | null) => {
  const { data, error, isValidating, isLoading } = useSWR<SeasonWithSettings>(
    seasonId ? `/api/v1/dashboard/seasons/${seasonId}` : null,
    clientApiFetch,
    {
      revalidateOnFocus: false
    }
  );
  return {
    season: data,
    isLoading,
    isError: error,
    isValidating
  };
};
