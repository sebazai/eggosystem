import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";

interface MatchDetailsByGameIdResponse {
  match_id: number;
}

export const useMatchDetailsByGameId = (matchGameId: number | null) => {
  const { data, error, isLoading } = useSWR<MatchDetailsByGameIdResponse>(
    matchGameId ? `/api/v1/match-game/${matchGameId}/match` : null,
    expressFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000 // 5 minutes
    }
  );

  return {
    data,
    error,
    isLoading
  };
};
