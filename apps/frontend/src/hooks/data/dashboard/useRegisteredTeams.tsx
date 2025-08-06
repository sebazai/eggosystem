"use client";

import type { SeasonRegisteredTeamsWithPlayersValidatedTeams } from "@eggosystem/types";
import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import { useSWRConfig } from "swr";

export const useRegisteredTeams = () => {
  const { data, error, isLoading, isValidating } = useSWR<
    SeasonRegisteredTeamsWithPlayersValidatedTeams[]
  >("/api/v1/dashboard/registration/registered", clientApiFetch, {
    revalidateOnFocus: false
  });

  return {
    registeredTeams: data,
    isLoading,
    error,
    isValidating
  };
};

export const useBulkApproveTeams = () => {
  const { mutate } = useSWRConfig();

  const bulkApprove = async (teamIds: number[]) => {
    await clientApiFetch("/api/v1/dashboard/registration/bulk-approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ teamIds })
    });

    // Revalidate the registered teams data
    await mutate("/api/v1/dashboard/registration/registered");
  };

  return { bulkApprove };
};

export const useManualValidityCheck = () => {
  const { mutate } = useSWRConfig();

  const manualValidityCheck = async (teamIds: number[]) => {
    await clientApiFetch(
      "/api/v1/dashboard/registration/manual-validity-check",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ teamIds })
      }
    );

    // Revalidate the registered teams data
    await mutate("/api/v1/dashboard/registration/registered");
  };

  return { manualValidityCheck };
};
