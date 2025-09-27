import { expressFetcher } from "@/lib/utils";
import type { MapRoundInfo } from "@eggosystem/types";
import useSWR from "swr";

export const useGameRoundInfo = (matchGameId: number) => {
  const { data, error, isLoading } = useSWR<MapRoundInfo[]>(
    `/api/v1/match-games/${matchGameId}/roundinfo`,
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
