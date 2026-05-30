import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";

export interface RoundUtilityRow {
  round_number: number;
  steam_id: string;
  flashes_thrown: number;
  enemies_flashed: number;
  teammates_flashed: number;
  smokes_thrown: number;
  utility_damage: number;
  wasted_utility: number;
}

export const useRoundUtilitySummary = (matchGameId: number) => {
  const { data, error, isLoading } = useSWR<{
    round_utility_summary: RoundUtilityRow[];
  }>(
    `/api/v1/match-games/${matchGameId}/round-utility-summary`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    roundUtility: data?.round_utility_summary ?? [],
    isLoading,
    isError: error
  };
};
