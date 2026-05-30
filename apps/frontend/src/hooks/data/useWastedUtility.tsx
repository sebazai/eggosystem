import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";

interface WastedUtilityEntry {
  thrower_steam_id: string;
  utility_type: string;
  count: number;
}

interface WastedUtilityResponse {
  wasted_utility: WastedUtilityEntry[];
}

export const useWastedUtility = (matchGameId: number) => {
  const { data, error, isLoading } = useSWR<WastedUtilityResponse>(
    `/api/v1/match-games/${matchGameId}/wasted-utility`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    wastedUtility: data?.wasted_utility ?? [],
    isLoading,
    isError: error
  };
};
