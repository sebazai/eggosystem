"use client";

import type { SeasonRegisteredTeamsWithPlayersValidatedTeams } from "@eggosystem/types";
import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import { useSWRConfig } from "swr";

export const useRegisteredTeams = (seasonId: number | null) => {
  const { data, error, isLoading, isValidating } = useSWR<
    SeasonRegisteredTeamsWithPlayersValidatedTeams[]
  >(
    seasonId && seasonId > 0
      ? `/api/v1/dashboard/registration/season/${seasonId}/registered`
      : null,
    clientApiFetch,
    {
      revalidateOnFocus: false
    }
  );

  return {
    registeredTeams: data,
    isLoading,
    error,
    isValidating
  };
};

export const useBulkApproveTeams = (seasonId: number | null) => {
  const { mutate } = useSWRConfig();

  const bulkApprove = async (teamIds: number[]) => {
    if (!seasonId || seasonId <= 0) {
      throw new Error("Season ID is required for bulk approve");
    }

    await clientApiFetch(
      `/api/v1/dashboard/registration/season/${seasonId}/bulk-approve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ teamIds })
      }
    );

    // Revalidate the registered teams data for the specific season
    if (seasonId) {
      await mutate(
        `/api/v1/dashboard/registration/season/${seasonId}/registered`
      );
    }
  };

  return { bulkApprove };
};

export const useManualValidityCheck = (seasonId: number | null) => {
  const { mutate } = useSWRConfig();

  const manualValidityCheck = async (teamIds: number[]) => {
    if (!seasonId || seasonId <= 0) {
      throw new Error("Season ID is required for manual validity check");
    }

    await clientApiFetch(
      `/api/v1/dashboard/registration/season/${seasonId}/manual-validity-check`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ teamIds })
      }
    );

    // Revalidate the registered teams data for the specific season
    if (seasonId) {
      await mutate(
        `/api/v1/dashboard/registration/season/${seasonId}/registered`
      );
    }
  };

  return { manualValidityCheck };
};
