"use client";

import useSWR from "swr";
import type { UserProfilePayload } from "@eggosystem/types";
import { clientApiFetch } from "@/lib/apiClient";

export const useAccountDetails = () => {
  const { data, error, isLoading, isValidating } = useSWR<
    { details: UserProfilePayload },
    Error
  >(`/api/v1/accounts/profile`, clientApiFetch, {
    revalidateOnFocus: false,
    revalidateOnMount: false
  });

  return {
    account: data,
    isLoading,
    isError: error,
    isValidating
  };
};
