import type { TeamRetakeStats } from "@eggosystem/types";
import { clientApiFetch } from "@/lib/apiClient";
import { generateFiltersParamQuery } from "@/lib/utils";
import useSWR from "swr";
import type { FilterParamsQuery } from "@/lib/utils";

interface UseFilteredTeamRetakeStatsProps {
  teamId: number;
  filterQueryParams: FilterParamsQuery;
}

interface RetakeStatsResponse {
  success: boolean;
  data: TeamRetakeStats[];
}

export const useFilteredTeamRetakeStats = ({
  teamId,
  filterQueryParams
}: UseFilteredTeamRetakeStatsProps) => {
  const sortedQuery = generateFiltersParamQuery(filterQueryParams);

  const { data, error, isValidating, isLoading } = useSWR<RetakeStatsResponse>(
    `/api/v1/filters/stats/teams/${teamId}/retake-stats?${sortedQuery}`,
    clientApiFetch,
    {
      revalidateOnFocus: false
    }
  );

  return {
    teamRetakeStats: data?.data || [],
    isLoading,
    error,
    isValidating
  };
};
