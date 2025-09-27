import { expressFetcher } from "@/lib/utils";
import type { GameTeamRoundBreakdown } from "@eggosystem/types";
import useSWR from "swr";

export const useGameTeamRoundBreakdowns = (matchGameId?: number) => {
  const { data, error, isLoading, isValidating } = useSWR<
    GameTeamRoundBreakdown[]
  >(
    matchGameId ? `/api/v1/match-games/${matchGameId}/breakdown` : null,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    teamsRoundBreakdown: data,
    isValidating,
    isLoading,
    isError: error
  };
};
