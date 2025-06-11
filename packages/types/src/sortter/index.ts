/**
 * Interface for team values used in the sortter functionality
 * Contains the team information and calculated values for team sorting
 */
export interface TeamSortterValues {
  team_id: number;
  team_name: string;
  team_logo: string;
  league_name: string;
  /** Sum of kanaelo for top 5 players */
  top5_sum: number;
  /** Average of kanaelo for top 4 players */
  avg4: number;
  /** Kanaelo values for top 5 players as an array */
  top5_values: number[];
}

/**
 * Interface for raw database results before parsing
 */
export interface TeamSortterValuesRaw
  extends Omit<TeamSortterValues, "top5_values"> {
  top5_values: string;
}
