"use client";

import { clientApiFetch } from "@/lib/apiClient";
import type { PastSeason } from "@eggosystem/types";
import useSWR from "swr";

export const usePastSeasons = () => {
  const { data, error, isValidating, isLoading } = useSWR<PastSeason[]>(
    "/api/v1/seasons/past",
    clientApiFetch,
    { revalidateOnFocus: false }
  );

  return {
    seasons: data,
    isLoading,
    isError: error,
    isValidating
  };
};
