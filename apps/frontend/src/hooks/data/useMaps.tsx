"use client";

import { expressFetcher } from "@/lib/utils";
import type { Map } from "@eggosystem/types";
import useSWR from "swr";

export const useMaps = () => {
  const { data, error, isValidating } = useSWR<Map[]>(
    "/api/v1/maps",
    expressFetcher,
    { revalidateOnFocus: false }
  );

  // Convert the array to a record for easy lookup
  const mapsRecord: Record<number, string> = {};
  if (data) {
    data.forEach((map) => {
      mapsRecord[map.id] = map.name;
    });
  }

  return {
    maps: data || [],
    mapsRecord,
    isLoading: !data && !error,
    isError: error,
    isValidating
  };
};
