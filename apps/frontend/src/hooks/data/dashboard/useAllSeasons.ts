"use client";

import { clientApiFetch } from "@/lib/apiClient";
import type { SeasonWithSettings } from "@eggosystem/types";
import useSWR from "swr";

/**
 * Hook to fetch all seasons for admin dashboard use.
 * Uses the dashboard endpoint which requires admin/helpdesk permissions.
 */
export const useAllSeasons = () => {
  const apiUrl = "/api/v1/dashboard/seasons";

  const { data, error, isValidating, isLoading } = useSWR<SeasonWithSettings[]>(
    apiUrl,
    clientApiFetch,
    {
      revalidateOnFocus: false
    }
  );

  return {
    seasons: data,
    isLoading,
    isError: error,
    isValidating
  };
};
