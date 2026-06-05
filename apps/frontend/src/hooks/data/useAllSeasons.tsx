"use client";

import { clientApiFetch } from "@/lib/apiClient";
import type { SeasonWithSettings } from "@eggosystem/types";
import useSWR from "swr";

export const useAllSeasons = () => {
  const apiUrl = "/api/v1/seasons";

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
