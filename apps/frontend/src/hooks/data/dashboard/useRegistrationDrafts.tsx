"use client";

import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import type { RegistrationDraftRaw } from "@eggosystem/types";

export const useRegistrationDrafts = (seasonId: number | null) => {
  const { data, error, isLoading, isValidating } = useSWR<
    RegistrationDraftRaw[]
  >(
    seasonId && seasonId > 0
      ? `/api/v1/dashboard/registration/season/${seasonId}/drafts`
      : null,
    clientApiFetch,
    {
      revalidateOnFocus: false
    }
  );

  return {
    registrationDrafts: data,
    isLoading,
    error,
    isValidating
  };
};
