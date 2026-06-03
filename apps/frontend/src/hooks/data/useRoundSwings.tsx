import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";

export interface RoundSwingEntry {
  round_number: number;
  time_in_round: number;
  event_type: string;
  pre_win_prob: number;
  post_win_prob: number;
  delta: number;
  primary_player_steam_id: string;
  contributors: { steam_id: string; contribution: number }[];
  // Kill detail fields (present when event_type = 'kill')
  victim_steam_id: string | null;
  weapon: string | null;
  is_headshot: boolean | null;
  is_post_plant: boolean | null;
  cts_alive_after: number | null;
  ts_alive_after: number | null;
}

interface RoundSwingsResponse {
  round_swings: RoundSwingEntry[];
}

export const useRoundSwings = (
  matchGameId: number,
  roundNumber?: number,
  limit?: number
) => {
  const params = new URLSearchParams();
  if (roundNumber !== undefined) params.set("roundNumber", String(roundNumber));
  if (limit !== undefined) params.set("limit", String(limit));
  const query = params.toString() ? `?${params.toString()}` : "";

  const { data, error, isLoading } = useSWR<RoundSwingsResponse>(
    `/api/v1/match-games/${matchGameId}/round-swings${query}`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    roundSwings: data?.round_swings ?? [],
    isLoading,
    isError: error
  };
};
