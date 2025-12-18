import type {
  SeasonResultsDivision,
  SeasonResultsSeasonOption,
  SeasonResultsWinnerRow
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

/**
 * Get all winners (top 3 teams per division) for a specific season
 */
export const getSeasonResultsForSeason = async (
  seasonId: number
): Promise<SeasonResultsDivision[]> => {
  const query = `
    SELECT
      t.id AS team_id,
      t.name AS team_name,
      t.team_logo AS team_logo,
      slt.placement,
      l.id AS league_id,
      l.name AS league_name
    FROM SeasonLeagueTeams slt
    JOIN Teams t ON t.id = slt.team_id
    JOIN Leagues l ON l.id = slt.league_id
    WHERE slt.season_id = ?
      AND slt.placement IS NOT NULL
      AND slt.placement <= 3
    ORDER BY l.sort_priority ASC, l.id ASC, slt.placement ASC
  `;

  const rows = await runQuery<SeasonResultsWinnerRow[]>(query, [seasonId]);

  // Group by division (league)
  const divisionMap = new Map<number, SeasonResultsDivision>();

  for (const row of rows) {
    if (!divisionMap.has(row.league_id)) {
      divisionMap.set(row.league_id, {
        league_id: row.league_id,
        league_name: row.league_name,
        teams: []
      });
    }

    divisionMap.get(row.league_id)!.teams.push({
      team_id: row.team_id,
      team_name: row.team_name,
      team_logo: row.team_logo,
      placement: row.placement
    });
  }

  return Array.from(divisionMap.values());
};

/**
 * Get seasons that have finalized placements (for dropdown)
 */
export const getSeasonsWithPlacements = async (): Promise<
  SeasonResultsSeasonOption[]
> => {
  const query = `
    SELECT DISTINCT
      s.id AS season_id,
      s.full_name AS season_name
    FROM Seasons s
    JOIN SeasonLeagueTeams slt ON slt.season_id = s.id
    WHERE slt.placement IS NOT NULL
      AND slt.placement <= 3
    ORDER BY s.id DESC
  `;

  const rows =
    await runQuery<{ season_id: number; season_name: string }[]>(query);

  return rows.map((row) => ({
    season_id: row.season_id,
    season_name: row.season_name
  }));
};

/**
 * Get the season name for a given season ID
 */
export const getSeasonNameById = async (
  seasonId: number
): Promise<string | null> => {
  const query = `SELECT full_name FROM Seasons WHERE id = ?`;
  const [result] = await runQuery<{ full_name: string }[]>(query, [seasonId]);
  return result?.full_name || null;
};
