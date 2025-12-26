"use client";

import { clientApiFetch } from "@/lib/apiClient";
import useSWR from "swr";
import type { CaptainCheckResponse } from "@eggosystem/types";

export function useCheckCaptain(
  seasonId: string | null,
  teamId: string | null,
  role: string
) {
  const shouldFetch =
    seasonId && teamId && (role === "captain" || role === "co-captain");

  const { data, error, isLoading } = useSWR<CaptainCheckResponse>(
    shouldFetch
      ? `/api/v1/dashboard/role-management/check-captain?season_id=${seasonId}&team_id=${teamId}&role=${role}`
      : null,
    clientApiFetch,
    {
      revalidateOnFocus: true
    }
  );

  return {
    existingCaptain: data?.data || null,
    isLoading,
    isError: error
  };
}
