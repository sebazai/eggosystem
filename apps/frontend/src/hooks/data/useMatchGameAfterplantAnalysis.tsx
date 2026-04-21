import { expressFetcher } from "@/lib/utils";
import type { MatchGameAfterplantRound } from "@eggosystem/types";
import useSWR from "swr";

export const useMatchGameAfterplantAnalysis = (matchGameId: number) => {
  const { data, error, isLoading } = useSWR<MatchGameAfterplantRound[]>(
    `/api/v1/match-games/${matchGameId}/afterplant-analysis`,
    expressFetcher,
    {
      revalidateOnFocus: false
    }
  );

  return {
    afterplantRounds: data,
    isLoading,
    isError: error
  };
};
