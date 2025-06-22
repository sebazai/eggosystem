import useSWR from "swr";
import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";
import type { PlayerSkillDiagram } from "@eggosystem/types";
import { envConfig } from "@/configs/env";

interface PlayerTeamDetails {
  team_id: number;
  team_name: string;
}

interface UsePlayerSkillDiagramParams {
  steamId: string;
  compareOption?: string;
  filterQueryParams: FilterParamsQuery;
  playerTeam?: PlayerTeamDetails | null;
}

interface UsePlayerSkillDiagramResult {
  playerSkillData: PlayerSkillDiagram | null;
  compareSkillData: PlayerSkillDiagram | null;
  isLoading: boolean;
  error: Error | null;
  isCompareDataNotFound: boolean;
}

export const usePlayerSkillDiagram = ({
  steamId,
  compareOption = "none",
  filterQueryParams,
  playerTeam
}: UsePlayerSkillDiagramParams): UsePlayerSkillDiagramResult => {
  // Use the same filter param query generator used by other components
  const sortedQuery = generateFiltersParamQuery(filterQueryParams);

  // Helper function to add parameters to URL correctly
  const addParamsToUrl = (
    baseUrl: string,
    params: Record<string, string | number>
  ) => {
    const hasQueryParams = baseUrl.includes("?");
    let url = baseUrl;

    Object.entries(params).forEach(([key, value], index) => {
      if (index === 0 && !hasQueryParams) {
        url += `?${key}=${value}`;
      } else {
        url += `&${key}=${value}`;
      }
    });

    return url;
  };

  // Fetch player skill data
  const {
    data: playerData,
    error: playerError,
    isLoading: playerLoading
  } = useSWR<PlayerSkillDiagram>(
    `/api/v1/players/${steamId}/skill-diagram${sortedQuery ? `?${sortedQuery}` : ""}`,
    expressFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000 // 30 seconds
    }
  );

  // Fetch comparison data based on selected option
  let compareUrl: string | null = null;

  if (compareOption === "aggregate") {
    // All players aggregate
    compareUrl = sortedQuery
      ? `/api/v1/players/skill-diagram/aggregate?${sortedQuery}`
      : "/api/v1/players/skill-diagram/aggregate";
  } else if (compareOption.startsWith("faceit_")) {
    // Faceit level comparison (e.g., faceit_3 for Faceit Level 3)
    const faceitLevel = compareOption.split("_")[1] || "5"; // Default to level 5 if not specified
    const baseUrl = `/api/v1/players/skill-diagram/aggregate${sortedQuery ? `?${sortedQuery}` : ""}`;
    compareUrl = addParamsToUrl(baseUrl, { faceit_level: faceitLevel });
  } else if (compareOption.startsWith("cs2rank_")) {
    // CS2 rank comparison (e.g., cs2rank_2000 for rank 2000)
    const rankValue = compareOption.split("_")[1] || "2000"; // Default to 2000 if not specified
    const rankMin = parseInt(rankValue) - 500;
    const rankMax = parseInt(rankValue) + 500;
    const baseUrl = `/api/v1/players/skill-diagram/aggregate${sortedQuery ? `?${sortedQuery}` : ""}`;
    compareUrl = addParamsToUrl(baseUrl, {
      cs2_rank_min: rankMin,
      cs2_rank_max: rankMax
    });
  } else if (compareOption === "team" && playerTeam?.team_id) {
    // Player's own team - use the team_id from playerTeam prop
    const baseUrl = `/api/v1/players/skill-diagram/aggregate${sortedQuery ? `?${sortedQuery}` : ""}`;
    compareUrl = addParamsToUrl(baseUrl, { team_ids: playerTeam.team_id });
  }

  const {
    data: compareData,
    error: compareError,
    isLoading: compareLoading
  } = useSWR<PlayerSkillDiagram>(
    compareOption !== "none" && compareUrl ? compareUrl : null,
    async (url) => {
      try {
        // Ensure we're using the backend API URL
        const apiUrl = `${envConfig.API_URL}${url}`;
        const response = await fetch(apiUrl);

        if (response.status === 404) {
          // Return null for 404 - no data available
          return null;
        }
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching comparison data:", error);
        throw error;
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000 // 30 seconds
    }
  );

  // Check if we got a 404 (no data) for the comparison
  const isCompareDataNotFound =
    compareOption !== "none" &&
    !compareLoading &&
    !compareData &&
    !compareError;

  return {
    playerSkillData: playerData || null,
    compareSkillData: compareData || null,
    isLoading: playerLoading || (compareOption !== "none" && compareLoading),
    error: playerError || compareError || null,
    isCompareDataNotFound
  };
};
