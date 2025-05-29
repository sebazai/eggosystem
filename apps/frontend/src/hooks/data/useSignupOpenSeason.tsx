"use client";

import { clientApiFetch } from "@/lib/apiClient";
import type { ActiveSeasonSignupForAppId } from "@eggosystem/types";
import useSWR from "swr";

export const useSignupOpenForAppId = (appId: number) => {
  const apiUrl = `/api/v1/seasons/app/${appId}/signup-open`;

  const { data, error, isValidating, isLoading } =
    useSWR<ActiveSeasonSignupForAppId>(apiUrl, clientApiFetch, {
      revalidateOnFocus: false
    });

  return {
    seasonWithSignupOpen: data,
    isLoading,
    isError: error,
    isValidating
  };
};
