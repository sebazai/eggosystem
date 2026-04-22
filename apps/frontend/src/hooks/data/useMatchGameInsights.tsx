import { expressFetcher } from "@/lib/utils";
import type { MatchGameInsights } from "@eggosystem/types";
import useSWR from "swr";

export const useMatchGameInsights = (matchGameId: number) => {
  const { data, error, isLoading } = useSWR<MatchGameInsights>(
    `/api/v1/match-games/${matchGameId}/insights`,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    insights: data,
    isLoading,
    isError: error
  };
};
