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
 * Get all trophy assignments for a player
 * This includes:
 * 1. Direct player trophies (like kanarating achievements)
 * 2. Team trophies inherited via SeasonTeamPlayers membership
 */
export const getPlayerTrophyAssignments = async (
  steamId: string
): Promise<TrophiesResponse> => {
  // Query combines:
  // 1. Direct player trophies (steam_id = player)
  // 2. Team trophies where player was a primary member of the team in that season
  const rows = await runQuery<
    Array<{
      id: number;
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
    }>
  >(
    `
    -- Direct player trophies
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
    
    -- Team trophies inherited via SeasonTeamPlayers
    SELECT 
      ta.id,
      ta.trophy_id,
      t.name as trophy_name,
      t.display_name as trophy_display_name,
      t.category as trophy_category,
      t.image_phash,
      t.placement,
      NULL as steam_id,
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
    JOIN SeasonTeamPlayers stp ON 
      stp.team_id = ta.team_id 
      AND stp.season_id = ta.season_id
      AND stp.role = 'primary'
    WHERE ta.team_id IS NOT NULL 
      AND ta.steam_id IS NULL
      AND stp.steam_id = ?
    
    ORDER BY season_id DESC, trophy_category, placement
    `,
    [steamId, steamId]
  );

  const trophies: TrophyAssignment[] = rows.map((row) => ({
    id: row.id,
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
  }));

  return { trophies };
};

/**
 * Get all trophy assignments for a team
 */
export const getTeamTrophyAssignments = async (
  teamId: number
): Promise<TrophiesResponse> => {
  const rows = await runQuery<
    Array<{
      id: number;
      trophy_id: number;
      trophy_name: string;
      trophy_display_name: string;
      trophy_category: "season_placement" | "kanarating" | "special";
      image_phash: string | null;
      placement: number | null;
      team_id: number;
      season_id: number;
      season_name: string;
      season_full_name: string;
      league_id: number | null;
      league_name: string | null;
      custom_text: string | null;
    }>
  >(
    `SELECT 
      ta.id,
      ta.trophy_id,
      t.name as trophy_name,
      t.display_name as trophy_display_name,
      t.category as trophy_category,
      t.image_phash,
      t.placement,
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
    WHERE ta.team_id = ?
    ORDER BY s.start_date DESC, t.category, t.placement`,
    [teamId]
  );

  const trophies: TrophyAssignment[] = rows.map((row) => ({
    id: row.id,
    trophy_id: row.trophy_id,
    trophy_name: row.trophy_name,
    trophy_category: row.trophy_category,
    image_phash: row.image_phash,
    placement: row.placement,
    team_id: row.team_id,
    steam_id: null,
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
  }));

  return { trophies };
};
