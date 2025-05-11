"use client";

import useSWR from "swr";
import type { UserProfilePayload } from "@eggosystem/types";
import { clientApiFetch } from "@/lib/apiClient";
import { useEffect } from "react";

export const useAccountDetails = () => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<
    { details: UserProfilePayload },
    Error
  >(`/api/v1/accounts/profile`, clientApiFetch, {
    revalidateOnFocus: false,
    revalidateOnMount: false
  });

  useEffect(() => {
    if (data === undefined) {
      mutate();
    }
  }, [data, mutate]);

  return {
    account: data,
    isLoading,
    isError: error,
    isValidating
  };
};
