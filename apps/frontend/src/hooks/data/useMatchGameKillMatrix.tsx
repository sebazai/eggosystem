import { expressFetcher } from "@/lib/utils";
import type { MatchGameKillMatrix } from "@eggosystem/types";
import useSWR from "swr";

export const useMatchGameKillMatrix = (matchGameId: number) => {
  const { data, error, isLoading } = useSWR<MatchGameKillMatrix>(
    `/api/v1/match-games/${matchGameId}/kill-matrix`,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    killMatrix: data,
    isLoading,
    isError: error
  };
};
