"use client";

import useSWR from "swr";
import type { Account } from "@eggosystem/types";
import { clientApiFetch } from "@/lib/apiClient";

export const useEmailsVerified = (accountId?: number) => {
  const { data, error, isLoading, isValidating } = useSWR<
    Pick<Account, "work_email_verified" | "work_email_token_expires_at">,
    Error
  >(
    accountId ? `/api/v1/accounts/${accountId}/emails-verified` : null,
    clientApiFetch,
    { revalidateOnFocus: false }
  );

  return {
    emailsVerified: data,
    isLoading,
    isError: error,
    isValidating
  };
};
