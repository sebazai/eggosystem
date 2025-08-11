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
  const query = `INSERT INTO SeasonLeagueExternalIds (external_id, external_league_name, season_id, league_id, stage, type, isBO2PlayedAs2xBO1) VALUES (?, ?, ?, ?, ?, ?, ?)`;
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
