import { expressFetcher } from "@/lib/utils";
import type { MatchGameTeamRoundBreakdown } from "@eggosystem/types";
import useSWR from "swr";

export const useMatchGameTeamRoundBreakdowns = (gameId?: number) => {
  const { data, error, isLoading, isValidating } = useSWR<
    MatchGameTeamRoundBreakdown[]
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
