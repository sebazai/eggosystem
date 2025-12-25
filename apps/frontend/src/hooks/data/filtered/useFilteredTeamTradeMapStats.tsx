import type { TeamTradeMapStats } from "@eggosystem/types";
import { clientApiFetch } from "@/lib/apiClient";
import { generateFiltersParamQuery } from "@/lib/utils";
import useSWR from "swr";
import type { FilterParamsQuery } from "@/lib/utils";

interface UseFilteredTeamTradeMapStatsProps {
  teamId: number;
  filterQueryParams: FilterParamsQuery;
}

interface TradeMapStatsResponse {
  success: boolean;
  data: TeamTradeMapStats[];
}

export const useFilteredTeamTradeMapStats = ({
  teamId,
  filterQueryParams
}: UseFilteredTeamTradeMapStatsProps) => {
  const sortedQuery = generateFiltersParamQuery(filterQueryParams);

  const { data, error, isValidating, isLoading } =
    useSWR<TradeMapStatsResponse>(
      `/api/v1/filters/stats/teams/${teamId}/trade-map-stats?${sortedQuery}`,
      clientApiFetch,
      {
        revalidateOnFocus: false
      }
    );

  return {
    teamTradeMapStats: data?.data || [],
    isLoading,
    error,
    isValidating
  };
};
