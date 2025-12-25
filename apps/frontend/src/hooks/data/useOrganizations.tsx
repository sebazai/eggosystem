"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";
import type { Organizations } from "@eggosystem/types";

export const useOrganizations = (
  organizationId?: string,
  includePending: boolean = true
) => {
  const queryParams = organizationId ? "" : `?includePending=${includePending}`;
  const { data, error, isValidating } = useSWR<Organizations[], Error>(
    `/api/v1/organizations${organizationId ? `/${organizationId}` : queryParams}`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    organizations: data,
    isLoading: !data && !error, // When there is no data and no error, it's loading
    isError: error,
    isValidating
  };
};
