import { expressFetcher } from "@/lib/utils";
import type { MatchGameOpeningDuel } from "@eggosystem/types";
import useSWR from "swr";

export const useMatchGameOpeningDuels = (matchGameId: number) => {
  const { data, error, isLoading } = useSWR<MatchGameOpeningDuel[]>(
    `/api/v1/match-games/${matchGameId}/opening-duels`,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    openingDuels: data,
    isLoading,
    isError: error
  };
};
