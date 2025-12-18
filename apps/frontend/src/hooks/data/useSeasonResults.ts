import useSWR from "swr";
import type {
  SeasonResultsResponse,
  SeasonResultsSeasonOption
} from "@eggosystem/types";
import { expressFetcher } from "@/lib/utils";

export const useSeasonResults = (seasonId: number | null) => {
  const { data, error, isLoading, isValidating } =
    useSWR<SeasonResultsResponse>(
      seasonId ? `/api/v1/season-results?season_id=${seasonId}` : null,
      expressFetcher,
      {
        revalidateOnFocus: false,
        dedupingInterval: 60000 // Cache for 1 minute
      }
    );

  return {
    data,
    isLoading,
    isValidating,
    error
  };
};

export const useSeasonResultsSeasons = () => {
  const { data, error, isLoading, isValidating } = useSWR<
    SeasonResultsSeasonOption[]
  >("/api/v1/season-results/seasons", expressFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000 // Cache for 5 minutes
  });

  return {
    seasons: data || [],
    isLoading,
    isValidating,
    error
  };
};
