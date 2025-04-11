"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";
import type { League } from "@eggosystem/types";

export const useLeagues = (leagueId?: string) => {
  const { data, error, isValidating } = useSWR<League[], Error>(
    `/api/v1/leagues${leagueId ? `/${leagueId}` : ""}`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    leagues: data,
    isLoading: !data && !error, // When there is no data and no error, it's loading
    isError: error,
    isValidating
  };
};
