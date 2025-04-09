"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";
import type { SeasonDetails } from "@eggosystem/types";

export const useSeasonDetails = (seasonId: string) => {
  const { data, error, isValidating, isLoading } = useSWR<SeasonDetails, Error>(
    `/api/v1/seasons/${seasonId}/details`,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    seasonDetails: data,
    isLoading: isLoading,
    isError: error,
    isValidating
  };
};
