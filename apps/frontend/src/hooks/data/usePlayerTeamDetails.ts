import useSWR from "swr";
import { generateFiltersParamQuery } from "@/lib/utils";
import { envConfig } from "@/configs/env";
import type { FilterParamsQuery } from "@/lib/utils";

interface PlayerTeamDetails {
  team_id: number;
  team_name: string;
}

interface UsePlayerTeamDetailsProps {
  steamId: string;
  filterQueryParams: FilterParamsQuery;
}

export const usePlayerTeamDetails = ({
  steamId,
  filterQueryParams
}: UsePlayerTeamDetailsProps) => {
  const queryString = filterQueryParams
    ? generateFiltersParamQuery(filterQueryParams)
    : "";
  const url = `${envConfig.API_URL}/api/v1/filters/players/${steamId}/teams${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading, isValidating } = useSWR<PlayerTeamDetails[]>(
    steamId ? url : null,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch player team details: ${response.status}`
        );
      }
      return response.json();
    },
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 5 * 60 * 1000 // 5 minutes
    }
  );

  // Extract the first team from the array or return null
  const playerTeam =
    data && Array.isArray(data) && data.length > 0 && data[0]
      ? {
          team_id: data[0].team_id,
          team_name: data[0].team_name
        }
      : null;

  return {
    playerTeam,
    isLoading,
    error,
    isValidating
  };
};
