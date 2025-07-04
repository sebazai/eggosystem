"use client";

import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import type { RegistrationDraftRaw } from "@eggosystem/types";

export const useRegistrationDrafts = () => {
  const { data, error, isLoading, isValidating } = useSWR<
    RegistrationDraftRaw[]
  >("/api/v1/dashboard/registration/drafts", clientApiFetch, {
    revalidateOnFocus: false
  });

  return {
    registrationDrafts: data,
    isLoading,
    error,
    isValidating
  };
};
