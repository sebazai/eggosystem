import useSWR from "swr";
import type {
  HallOfFameCategory,
  HallOfFameOrganization,
  HallOfFameTeam,
  HallOfFamePlayer,
  HallOfFameResponse
} from "@eggosystem/types";
import { expressFetcher } from "@/lib/utils";

export const useHallOfFame = (
  category: HallOfFameCategory = "players",
  limit: number = 50
) => {
  const { data, error, isLoading, isValidating } = useSWR<HallOfFameResponse>(
    `/api/v1/hall-of-fame?category=${category}&limit=${limit}`,
    expressFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000 // Cache for 1 minute
    }
  );

  return {
    data: data?.data as
      | HallOfFameOrganization[]
      | HallOfFameTeam[]
      | HallOfFamePlayer[]
      | undefined,
    category: data?.category,
    isLoading,
    isValidating,
    error
  };
};
