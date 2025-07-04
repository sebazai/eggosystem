"use client";

import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import type { RegistrationDraft } from "@eggosystem/types";

export const useRegistrationDrafts = () => {
  const { data, error, isLoading, isValidating } = useSWR<RegistrationDraft[]>(
    "/api/v1/dashboard/registration/drafts",
    clientApiFetch,
    { revalidateOnFocus: false }
  );

  return {
    registrationDrafts: data,
    isLoading,
    error,
    isValidating
  };
};
