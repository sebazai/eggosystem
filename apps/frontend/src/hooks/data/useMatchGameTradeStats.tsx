import { expressFetcher } from "@/lib/utils";
import type { MatchGameTradeStats } from "@eggosystem/types";
import useSWR from "swr";

export const useMatchGameTradeStats = (matchGameId: number) => {
  const { data, error, isLoading } = useSWR<MatchGameTradeStats>(
    `/api/v1/match-games/${matchGameId}/trade-stats`,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    tradeStats: data,
    isLoading,
    isError: error
  };
};
