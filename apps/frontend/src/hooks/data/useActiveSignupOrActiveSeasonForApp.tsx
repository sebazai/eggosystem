"use client";

import { clientApiFetch } from "@/lib/apiClient";
import type { ActiveSignupOrSeasonForAppId } from "@eggosystem/types";
import useSWR from "swr";

export const useActiveSignupOrActiveSeasonForApp = (appId: number) => {
  const apiUrl = `/api/v1/organizers/1/app/${appId}/seasons/active-signup-open`;

  const { data, error, isValidating, isLoading } =
    useSWR<ActiveSignupOrSeasonForAppId>(apiUrl, clientApiFetch, {
      revalidateOnFocus: false
    });

  const signupOrActiveSeason =
    data && typeof data.season_id === "number" && data.season_id > 0
      ? data
      : undefined;

  return {
    signupOrActiveSeason,
    isLoading,
    isError: error,
    isValidating
  };
};
