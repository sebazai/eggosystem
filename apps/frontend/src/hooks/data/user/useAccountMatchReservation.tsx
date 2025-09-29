"use client";

import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import type { Reservation } from "@eggosystem/types";
import type { SWRResponse } from "swr";

export function useAccountMatchReservation(
  matchId: string | undefined
): SWRResponse<Reservation | null, Error> {
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<Reservation | null>(
      matchId ? `/api/v1/accounts/reservations/match/${matchId}` : null,
      clientApiFetch,
      {
        revalidateOnFocus: true,
        revalidateOnReconnect: true
      }
    );

  return {
    data: data ?? null,
    isValidating,
    isLoading,
    error: error as Error | undefined,
    mutate
  };
}
