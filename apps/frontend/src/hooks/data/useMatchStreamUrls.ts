"use client";

import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";

interface MatchStreamUrlsResponse {
  streamUrls: string[];
}

export function useMatchStreamUrls(matchId: number | undefined) {
  const { data, error, isLoading } = useSWR<MatchStreamUrlsResponse>(
    matchId ? `/api/v1/matches/${matchId}/streams` : null,
    clientApiFetch,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000 // 1 minute
    }
  );

  return {
    streamUrls: data?.streamUrls ?? [],
    isLoading,
    error: error as Error | undefined
  };
}
