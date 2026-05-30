import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";

export interface FlashPair {
  thrower_steam_id: string;
  victim_steam_id: string;
  flash_count: number;
  avg_duration_seconds: number;
  total_duration_seconds: number;
}

interface FlashPlayerStat {
  steam_id: string;
  enemy_flashes: number;
  teammate_flashes: number;
  self_flashes: number;
  total_flashes: number;
  avg_duration_seconds: number;
  total_duration_seconds: number;
}

interface FlashMatrixResponse {
  flash_matrix: FlashPair[];
  player_stats: FlashPlayerStat[];
}

export const useFlashMatrix = (matchGameId: number) => {
  const { data, error, isLoading } = useSWR<FlashMatrixResponse>(
    `/api/v1/match-games/${matchGameId}/flash-matrix`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    flashMatrix: data?.flash_matrix ?? [],
    playerStats: data?.player_stats ?? [],
    isLoading,
    isError: error
  };
};
