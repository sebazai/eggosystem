import { expressFetcher } from "@/lib/utils";
import type { GameTeamRoundBreakdown } from "@eggosystem/types";
import useSWR from "swr";

export const useGameTeamRoundBreakdowns = (gameId?: number) => {
  const { data, error, isLoading, isValidating } = useSWR<
    GameTeamRoundBreakdown[]
  >(gameId ? `/api/v1/games/${gameId}/breakdown` : null, expressFetcher, {
    revalidateOnFocus: false
  });

  return {
    teamsRoundBreakdown: data,
    isValidating,
    isLoading,
    isError: error
  };
};
