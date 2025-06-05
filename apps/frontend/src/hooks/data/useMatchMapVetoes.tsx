import { expressFetcher } from "@/lib/utils";
import type { MatchMapVetoes } from "@eggosystem/types";
import useSWR from "swr";

export const useMatchMapVetoes = (matchId: number) => {
  const { data, error, isValidating, isLoading } = useSWR<MatchMapVetoes[]>(
    `/api/v1/matches/${matchId}/vetoes`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    vetoes: data,
    isLoading,
    isError: error,
    isValidating
  };
};
