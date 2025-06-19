import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";

interface PlayerTrophyData {
  rank: string;
  subrank: number;
  is_top50: boolean;
  position: number | null;
}

export const usePlayerTrophies = (steamId: string) => {
  return useSWR<PlayerTrophyData>(
    steamId ? `/api/v1/players/${steamId}/kanarank` : null,
    expressFetcher
  );
};
