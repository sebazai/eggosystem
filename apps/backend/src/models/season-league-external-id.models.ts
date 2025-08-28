import { type SeasonLeagueExternalId } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

export const getSeasonLeagueExternalIdByExternalId = async (
  externalId: string,
  connection?: PoolConnection
) => {
  const query = `SELECT * FROM SeasonLeagueExternalIds WHERE external_id = ?`;
  const [seasonLeagueExternaMatchRoomResult] = await runQuery<
    Array<SeasonLeagueExternalId | undefined>
  >(query, [externalId], connection);
  return seasonLeagueExternaMatchRoomResult;
};

export const insertSeasonLeagueExternalId = async (
  externalId: string,
  externalName: string,
  seasonId: number,
  leagueId: number,
  stage: number,
  type: string,
  isBO2PlayedAs2xBO1: boolean,
  connection?: PoolConnection
) => {
  const query = `INSERT INTO SeasonLeagueExternalIds (external_id, external_league_name, season_id, league_id, stage_id, type, isBO2PlayedAs2xBO1) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const seasonLeagueExternaMatchRoomResult = await runQuery<{
    insertId: number;
  }>(
    query,
    [
      externalId,
      externalName,
      seasonId,
      leagueId,
      stage,
      type,
      isBO2PlayedAs2xBO1
    ],
    connection
  );
  return seasonLeagueExternaMatchRoomResult;
};

export const removeSeasonLeagueExternalId = async (
  externalId: string,
  connection?: PoolConnection
) => {
  const query = `DELETE FROM SeasonLeagueExternalIds WHERE external_id = ?`;
  await runQuery(query, [externalId], connection);
};

export const getActiveSeasonChampionshipIds = async (): Promise<
  { external_id: string; isBO2PlayedAs2xBO1: boolean }[]
> => {
  const query = `
    SELECT slei.external_id, slei.isBO2PlayedAs2xBO1
    FROM SeasonLeagueExternalIds slei
    JOIN Seasons s ON slei.season_id = s.id
    WHERE s.start_date <= NOW() 
      AND (s.end_date IS NULL OR s.end_date >= NOW())
  `;

  const results =
    await runQuery<Array<{ external_id: string; isBO2PlayedAs2xBO1: boolean }>>(
      query
    );

  return results;
};
