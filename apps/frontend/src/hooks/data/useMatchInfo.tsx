import { expressFetcher } from "@/lib/utils";
import type {
  MatchInfo,
  MatchInfoQuery,
  MatchTeamInfo
} from "@eggosystem/types";
import useSWR from "swr";

export function useMatchInfo(matchId: string) {
  const { data, error } = useSWR<MatchInfoQuery>(
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

  const matchInfo = {
    ...data,
    teams: JSON.parse(data.teams) as Record<number, MatchTeamInfo>
  } satisfies MatchInfo;

  return {
    matchInfo,
    isLoading: !error && !data,
    isError: error
  };
}
