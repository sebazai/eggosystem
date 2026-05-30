import { expressFetcher } from "@/lib/utils";
import type { MatchGameKillMatrix } from "@eggosystem/types";
import useSWR from "swr";

export interface KillMatrixFilters {
  excludeExitKills?: boolean;
  postPlantOnly?: boolean;
  excludeEcoKills?: boolean;
}

export const useMatchGameKillMatrix = (
  matchGameId: number,
  filters: KillMatrixFilters = {}
) => {
  const params = new URLSearchParams();
  if (filters.excludeExitKills) params.set("excludeExitKills", "true");
  if (filters.postPlantOnly) params.set("postPlantOnly", "true");
  if (filters.excludeEcoKills) params.set("excludeEcoKills", "true");
  const query = params.toString();
  const url = `/api/v1/match-games/${matchGameId}/kill-matrix${query ? `?${query}` : ""}`;

  const { data, error, isLoading } = useSWR<MatchGameKillMatrix>(
    url,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    killMatrix: data,
    isLoading,
    isError: error
  };
};
