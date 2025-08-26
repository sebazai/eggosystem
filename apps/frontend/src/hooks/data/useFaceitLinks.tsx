"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";
import type { FaceitLink } from "@eggosystem/types";

export const useFaceitLinks = (seasonId: string) => {
  const { data, error, isValidating, isLoading } = useSWR<FaceitLink[], Error>(
    `/api/v1/seasons/${seasonId}/faceit-links`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    faceitLinks: data,
    isLoading,
    isError: error,
    isValidating
  };
};
