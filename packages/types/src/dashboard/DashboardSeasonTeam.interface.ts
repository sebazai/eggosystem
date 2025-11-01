import type { Nullable } from "@eggosystem/types";

/**
 * Team information for dashboard season team selection
 * Used for the add player functionality
 */
export interface DashboardSeasonTeam {
  team_id: number;
  team_name: string;
  league_name: string;
  tier: Nullable<number>;
}
