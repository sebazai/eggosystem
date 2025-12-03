import { runQuery } from "../db/mysqlRunQuery";
import type { League, LeaguesBySeason } from "@eggosystem/types";
import { type PoolConnection } from "mysql2/promise";

export const getLeagues = async (): Promise<League[]> => {
  return runQuery<League[]>("SELECT * FROM Leagues");
};

export const getLeaguesBySeason = async (
  seasonId: number
): Promise<LeaguesBySeason[]> => {
  const leaguesQuery = `
    SELECT 
      l.id,
      l.name,
      sl.season_id,
      sl.tier
    FROM Leagues l
    JOIN SeasonLeagues sl ON l.id = sl.league_id
    WHERE sl.season_id = ?
    ORDER BY sl.tier ASC
  `;

  return runQuery<LeaguesBySeason[]>(leaguesQuery, [seasonId]);
};

export const updateLeagueName = async (
  leagueId: number,
  newName: string,
  connection?: PoolConnection
) => {
  const query = `UPDATE Leagues SET name = ? WHERE id = ?`;
  await runQuery(query, [newName, leagueId], connection);
};

export const getLeagueById = async (
  leagueId: number,
  connection?: PoolConnection
) => {
  const query = `SELECT * FROM Leagues WHERE id = ?`;
  const [result] = await runQuery<Array<League | undefined>>(
    query,
    [leagueId],
    connection
  );
  return result;
};
