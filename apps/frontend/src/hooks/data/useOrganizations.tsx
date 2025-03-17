"use client";

import { fetcher } from "@/lib/utils";
import useSWR from "swr";
import type { Organizations } from "@eggosystem/types";

export const useOrganizations = (organizationId?: string) => {
  const { data, error, isValidating } = useSWR<Organizations[], Error>(
    `/api/organizations${organizationId ? `/${organizationId}` : ""}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    organizations: data,
    isLoading: !data && !error, // When there is no data and no error, it's loading
    isError: error,
    isValidating
  };
};
