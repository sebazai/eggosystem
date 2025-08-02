"use client";

import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";
import type { StandingsLeagues } from "@eggosystem/types";

export const useStandingLeagues = () => {
  const apiUrl = `/api/v1/standings/leagues`;

  const { data, error, isValidating, isLoading } = useSWR<{
    standingsLeagues: StandingsLeagues[];
  }>(apiUrl, expressFetcher, {
    revalidateOnFocus: false
  });

  return {
    standingsLeagues: data?.standingsLeagues || [],
    isLoading,
    isError: error,
    isValidating
  };
};
