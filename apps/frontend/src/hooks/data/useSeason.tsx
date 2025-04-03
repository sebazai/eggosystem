"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";
import type { Season } from "@eggosystem/types";

export const useSeason = (seasonId: string) => {
  const { data, error, isValidating, isLoading } = useSWR<Season, Error>(
    `/api/v1/seasons/${seasonId}`,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    season: data,
    isLoading: isLoading,
    isError: error,
    isValidating
  };
};
