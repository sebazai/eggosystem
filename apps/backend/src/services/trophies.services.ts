import { runQuery } from "../db/mysqlRunQuery";
import type { TrophyAssignment, TrophiesResponse } from "@eggosystem/types";

/**
 * Generate display text for a trophy assignment
 * Uses full season name (includes game) for complete context
 */
const formatTrophyDisplayText = (
  displayTemplate: string,
  leagueName: string | null,
  seasonFullName: string,
  customText: string | null
): string => {
  if (customText) {
    return customText;
  }

  // Replace placeholders in template
  let text = displayTemplate;
  if (leagueName) {
    text = text.replace("{league}", leagueName);
  }

  // Prepend full season name (e.g., "CS:GO Season 3 Masters Winner")
  return `${seasonFullName} ${text}`;
};

/**
 * Row type for trophy query results
 */
interface TrophyRow {
  id: number | null;
  trophy_id: number;
  trophy_name: string;
  trophy_display_name: string;
  trophy_category: "season_placement" | "kanarating" | "special";
  image_phash: string | null;
  placement: number | null;
  steam_id: string | null;
  team_id: number | null;
  season_id: number;
  season_name: string;
  season_full_name: string;
  league_id: number | null;
  league_name: string | null;
  custom_text: string | null;
}

/**
 * Map a trophy row to a TrophyAssignment
 */
const mapRowToTrophyAssignment = (row: TrophyRow): TrophyAssignment => ({
  id: row.id ?? 0, // Derived trophies don't have an assignment ID
  trophy_id: row.trophy_id,
  trophy_name: row.trophy_name,
  trophy_category: row.trophy_category,
  image_phash: row.image_phash,
  placement: row.placement,
  team_id: row.team_id,
  steam_id: row.steam_id,
  season_id: row.season_id,
  season_name: row.season_name,
  league_id: row.league_id,
  league_name: row.league_name,
  display_text: formatTrophyDisplayText(
    row.trophy_display_name,
    row.league_name,
    row.season_full_name,
    row.custom_text
  ),
  custom_text: row.custom_text
});

/**
 * Get all trophy assignments for a player
 * This includes:
 * 1. Direct player trophies from TrophyAssignments (kanarating, special)
 * 2. Team placement trophies derived from SeasonLeagueTeams via SeasonTeamPlayers membership
 */
export const getPlayerTrophyAssignments = async (
  steamId: string
): Promise<TrophiesResponse> => {
  // Query combines:
  // 1. Direct player trophies from TrophyAssignments (steam_id = player)
  // 2. Team placement trophies derived from SeasonLeagueTeams where player was a primary member
  const rows = await runQuery<Array<TrophyRow>>(
    `
    -- Direct player trophies from TrophyAssignments (kanarating, special, etc.)
    SELECT 
      ta.id,
      ta.trophy_id,
      t.name as trophy_name,
      t.display_name as trophy_display_name,
      t.category as trophy_category,
      t.image_phash,
      t.placement,
      ta.steam_id,
      ta.team_id,
      ta.season_id,
      s.name as season_name,
      s.full_name as season_full_name,
      ta.league_id,
      l.name as league_name,
      ta.custom_text
    FROM TrophyAssignments ta
    JOIN Trophies t ON ta.trophy_id = t.id
    JOIN Seasons s ON ta.season_id = s.id
    LEFT JOIN Leagues l ON ta.league_id = l.id
    WHERE ta.steam_id = ?
    
    UNION ALL
    
    -- Team placement trophies derived from SeasonLeagueTeams (normalized approach)
    -- Inherited via SeasonTeamPlayers primary membership
    SELECT 
      NULL as id,
      t.id as trophy_id,
      t.name as trophy_name,
      t.display_name as trophy_display_name,
      t.category as trophy_category,
      t.image_phash,
      t.placement,
      NULL as steam_id,
      slt.team_id,
      slt.season_id,
      s.name as season_name,
      s.full_name as season_full_name,
      slt.league_id,
      l.name as league_name,
      NULL as custom_text
    FROM SeasonLeagueTeams slt
    JOIN Trophies t ON t.category = 'season_placement' AND t.placement = slt.placement
    JOIN Seasons s ON s.id = slt.season_id
    LEFT JOIN Leagues l ON l.id = slt.league_id
    JOIN SeasonTeamPlayers stp ON 
      stp.team_id = slt.team_id 
      AND stp.season_id = slt.season_id
      AND stp.role = 'primary'
    WHERE slt.placement IS NOT NULL 
      AND slt.placement <= 3
      AND stp.steam_id = ?
    
    ORDER BY season_id DESC, trophy_category, placement
    `,
    [steamId, steamId]
  );

  const trophies: TrophyAssignment[] = rows.map(mapRowToTrophyAssignment);

  return { trophies };
};

/**
 * Get all trophy assignments for a team
 * Team placement trophies are derived from SeasonLeagueTeams.placement (normalized)
 */
export const getTeamTrophyAssignments = async (
  teamId: number
): Promise<TrophiesResponse> => {
  // Derive team season placement trophies from SeasonLeagueTeams
  // This avoids data duplication - SeasonLeagueTeams.placement is the single source of truth
  const rows = await runQuery<Array<TrophyRow>>(
    `SELECT 
      NULL as id,
      t.id as trophy_id,
      t.name as trophy_name,
      t.display_name as trophy_display_name,
      t.category as trophy_category,
      t.image_phash,
      t.placement,
      slt.team_id,
      slt.season_id,
      s.name as season_name,
      s.full_name as season_full_name,
      slt.league_id,
      l.name as league_name,
      NULL as custom_text,
      NULL as steam_id
    FROM SeasonLeagueTeams slt
    JOIN Trophies t ON t.category = 'season_placement' AND t.placement = slt.placement
    JOIN Seasons s ON s.id = slt.season_id
    LEFT JOIN Leagues l ON l.id = slt.league_id
    WHERE slt.team_id = ? 
      AND slt.placement IS NOT NULL 
      AND slt.placement <= 3
    ORDER BY s.start_date DESC, t.placement`,
    [teamId]
  );

  const trophies: TrophyAssignment[] = rows.map(mapRowToTrophyAssignment);

  return { trophies };
};
