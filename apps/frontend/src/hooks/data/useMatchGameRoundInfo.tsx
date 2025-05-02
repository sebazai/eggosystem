import { expressFetcher } from "@/lib/utils";
import type { MatchRoundInfo } from "@eggosystem/types";
import useSWR from "swr";

export const useMatchGameRoundInfo = (matchId: number, gameId?: number) => {
  const { data, error, isLoading } = useSWR<MatchRoundInfo[]>(
    `/api/v1/matches/${matchId}/games/${gameId}/roundinfo`,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    roundInfo: data,
    isLoading,
    isError: error
  };
};
