import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";

export interface FaceitLink {
  id: number;
  season_id: number;
  league_id: number;
  league_name: string;
  external_id: string;
  external_league_name: string | null;
  type: string;
  sort_priority: number;
  faceit_url: string;
}

export const getFaceitLinksForSeason = async (
  seasonId: number,
  connection?: PoolConnection
): Promise<FaceitLink[]> => {
  const query = `
    SELECT 
      slei.id,
      slei.season_id,
      slei.league_id,
      l.name AS league_name,
      slei.external_id,
      slei.external_league_name,
      slei.type,
      l.sort_priority,
      CONCAT('https://www.faceit.com/en/championship/', slei.external_id) AS faceit_url
    FROM SeasonLeagueExternalIds slei
    JOIN Leagues l ON l.id = slei.league_id
    WHERE slei.season_id = ?
    ORDER BY l.sort_priority ASC, l.name ASC
  `;

  const results = await runQuery<FaceitLink[]>(query, [seasonId], connection);
  return results;
};

export const getFaceitLinksForActiveSeason = async (
  connection?: PoolConnection
): Promise<FaceitLink[]> => {
  const query = `
    SELECT 
      slei.id,
      slei.season_id,
      slei.league_id,
      l.name AS league_name,
      slei.external_id,
      slei.external_league_name,
      slei.type,
      l.sort_priority,
      CONCAT('https://www.faceit.com/en/championship/', slei.external_id) AS faceit_url
    FROM SeasonLeagueExternalIds slei
    JOIN Leagues l ON l.id = slei.league_id
    JOIN Seasons s ON s.id = slei.season_id
    WHERE s.end_date IS NULL OR s.end_date > CURDATE()
    ORDER BY l.sort_priority ASC, l.name ASC
  `;

  const results = await runQuery<FaceitLink[]>(query, [], connection);
  return results;
};
