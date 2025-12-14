/**
 * Trophy category types
 */
export type TrophyCategory = "season_placement" | "kanarating" | "special";

/**
 * Trophy definition (from Trophies table)
 */
export interface Trophy {
  id: number;
  name: string;
  display_name: string;
  image_phash: string | null;
  placement: number | null;
  category: TrophyCategory;
}

/**
 * Trophy assignment with full context for display
 */
export interface TrophyAssignment {
  id: number;
  trophy_id: number;
  trophy_name: string;
  trophy_category: TrophyCategory;
  image_phash: string | null;
  placement: number | null;
  team_id: number | null;
  steam_id: string | null;
  season_id: number;
  season_name: string;
  league_id: number | null;
  league_name: string | null;
  display_text: string; // Pre-computed display text
  custom_text: string | null;
}

/**
 * API response for trophy endpoints
 */
export interface TrophiesResponse {
  trophies: TrophyAssignment[];
}
