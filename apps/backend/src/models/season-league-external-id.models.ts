import { type Nullable, type SeasonLeagueExternalId } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

export const getSeasonLeagueExternalIdByExternalIdWithSeasonSettings = async (
  externalId: string,
  connection?: PoolConnection
) => {
  const query = `SELECT slei.*, s.is_round_robin_bo2_as_2xbo1 FROM SeasonLeagueExternalIds slei
    JOIN Seasons s ON slei.season_id = s.id
    WHERE slei.external_id = ?`;
  const [seasonLeagueExternaMatchRoomResult] = await runQuery<
    Array<
      | (SeasonLeagueExternalId & { is_round_robin_bo2_as_2xbo1: boolean })
      | undefined
    >
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
  manualGroup: Nullable<number>,
  connection?: PoolConnection
) => {
  const query = `
    INSERT INTO SeasonLeagueExternalIds 
      (external_id, external_league_name, season_id, league_id, stage_id, type, manual_group) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const seasonLeagueExternaMatchRoomResult = await runQuery<{
    insertId: number;
  }>(
    query,
    [externalId, externalName, seasonId, leagueId, stage, type, manualGroup],
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
  { external_id: string; is_round_robin_bo2_as_2xbo1: boolean }[]
> => {
  const query = `
    SELECT slei.external_id, s.is_round_robin_bo2_as_2xbo1
    FROM SeasonLeagueExternalIds slei
    JOIN Seasons s ON slei.season_id = s.id
    WHERE (
      -- Active seasons (between start_date and end_date)
      (s.start_date <= NOW() AND (s.end_date IS NULL OR s.end_date >= NOW()))
      OR
      -- Seasons in signup period (between signup_end_date and start_date)
      (s.signup_end_date IS NOT NULL AND s.signup_end_date <= NOW() AND s.start_date > NOW())
    )
  `;

  const results =
    await runQuery<
      Array<{ external_id: string; is_round_robin_bo2_as_2xbo1: boolean }>
    >(query);

  return results;
};
