import { expressFetcher } from "@/lib/utils";
import type { MapRoundInfo } from "@eggosystem/types";
import useSWR from "swr";

export const useGameRoundInfo = (gameId: number) => {
  const { data, error, isLoading } = useSWR<MapRoundInfo[]>(
    `/api/v1/games/${gameId}/roundinfo`,
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
