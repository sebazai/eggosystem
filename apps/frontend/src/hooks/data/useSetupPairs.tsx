import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";

interface SetupPair {
  setup_player_steam_id: string;
  beneficiary_steam_id: string;
  setup_type: string;
  count: number;
  avg_seconds_after_setup: number;
}

interface SetupPairsResponse {
  setup_pairs: SetupPair[];
}

export const useSetupPairs = (matchGameId: number) => {
  const { data, error, isLoading } = useSWR<SetupPairsResponse>(
    `/api/v1/match-games/${matchGameId}/setup-pairs`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    setupPairs: data?.setup_pairs ?? [],
    isLoading,
    isError: error
  };
};
