"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";
import type { LeaguesBySeason } from "@eggosystem/types";

export const useSeasonLeagues = (seasonId: string) => {
  const { data, error, isValidating } = useSWR<LeaguesBySeason[], Error>(
    `/api/v1/seasons/${seasonId}/leagues`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    seasonLeagues: data,
    isLoading: !data && !error, // When there is no data and no error, it's loading
    isError: error,
    isValidating
  };
};
