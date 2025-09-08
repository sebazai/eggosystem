"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";

export const useIsMatch2xBO1StreamReservation = (matchId: string) => {
  const { data, error, isValidating, isLoading } = useSWR<{ is2xBO1: boolean }>(
    `/api/v1/matches/${matchId}/is-2xbo1`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    is2xBO1: data?.is2xBO1 || false,
    isLoading,
    isError: error,
    isValidating
  };
};
