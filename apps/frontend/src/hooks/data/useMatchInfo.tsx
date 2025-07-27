import { expressFetcher } from "@/lib/utils";
import type { MatchInfo } from "@eggosystem/types";
import useSWR from "swr";

export function useMatchInfo(matchId: string) {
  const { data, error } = useSWR<MatchInfo>(
    `/api/v1/matches/${matchId}/info`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  if (!data) {
    return {
      matchInfo: data,
      isLoading: !error && !data,
      isError: error
    };
  }

  return {
    matchInfo: data,
    isLoading: !error && !data,
    isError: error
  };
}
