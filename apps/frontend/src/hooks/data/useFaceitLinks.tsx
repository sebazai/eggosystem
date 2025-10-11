"use client";

import { clientApiFetch } from "@/lib/apiClient";
import useSWR from "swr";
import type { FaceitLink } from "@eggosystem/types";

export const useFaceitLinks = (seasonId: string) => {
  const { data, error, isValidating, isLoading } = useSWR<FaceitLink[], Error>(
    `/api/v1/seasons/${seasonId}/faceit-links`,
    clientApiFetch,
    { revalidateOnFocus: false }
  );

  return {
    faceitLinks: data,
    isLoading,
    isError: error,
    isValidating
  };
};
