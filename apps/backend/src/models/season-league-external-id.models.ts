import { type Nullable, type SeasonLeagueExternalId } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection, type ResultSetHeader } from "mysql2/promise";

/** Stage id for playoff (double elimination) in Stages table. */
const STAGE_ID_PLAYOFF = 2;

export const getPlayoffExternalIdBySeasonAndLeague = async (
  seasonId: number,
  leagueId: number
): Promise<string | null> => {
  const query = `
    SELECT slei.external_id
    FROM SeasonLeagueExternalIds slei
    WHERE slei.season_id = ? AND slei.league_id = ? AND slei.stage_id = ?
    LIMIT 1
  `;
  const [row] = await runQuery<Array<{ external_id: string } | undefined>>(
    query,
    [seasonId, leagueId, STAGE_ID_PLAYOFF]
  );
  return row?.external_id ?? null;
};

export const getSeasonLeagueExternalIdByExternalIdWithSeasonSettings = async (
  externalId: string,
  connection?: PoolConnection
) => {
  const query = `SELECT slei.*, COALESCE(css.is_round_robin_bo2_as_2xbo1, false) AS is_round_robin_bo2_as_2xbo1
    FROM SeasonLeagueExternalIds slei
    JOIN Seasons s ON slei.season_id = s.id
    LEFT JOIN CSSeasonSettings css ON css.season_id = s.id
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
  const seasonLeagueExternaMatchRoomResult = await runQuery<ResultSetHeader>(
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

export const getSeasonChampionshipIds = async (
  season_id: number
): Promise<{ external_id: string; is_round_robin_bo2_as_2xbo1: boolean }[]> => {
  const query = `
    SELECT slei.external_id, COALESCE(css.is_round_robin_bo2_as_2xbo1, false) AS is_round_robin_bo2_as_2xbo1
    FROM SeasonLeagueExternalIds slei
    JOIN Seasons s ON slei.season_id = s.id
    LEFT JOIN CSSeasonSettings css ON css.season_id = s.id
    WHERE slei.season_id = ?
  `;
  const results = await runQuery<
    Array<{ external_id: string; is_round_robin_bo2_as_2xbo1: boolean }>
  >(query, [season_id]);
  return results;
};

export const getOngoingFaceitCSSeasonChampionshipIds = async (): Promise<
  { external_id: string; is_round_robin_bo2_as_2xbo1: boolean }[]
> => {
  const query = `
    SELECT slei.external_id, COALESCE(css.is_round_robin_bo2_as_2xbo1, false) AS is_round_robin_bo2_as_2xbo1
    FROM SeasonLeagueExternalIds slei
    JOIN Seasons s ON slei.season_id = s.id
    JOIN Games g ON s.game_id = g.id
    LEFT JOIN CSSeasonSettings css ON css.season_id = s.id
    WHERE (
      -- Active seasons (between start_date and end_date)
      (s.start_date <= NOW() AND (s.end_date IS NULL OR s.end_date >= NOW()))
      OR
      -- Seasons in signup period (between signup_end_date and start_date)
      (s.signup_end_date IS NOT NULL AND s.signup_end_date <= NOW() AND s.start_date > NOW())
    )
    AND g.app_id = 730
    AND s.platform = 'faceit'
  `;

  const results =
    await runQuery<
      Array<{ external_id: string; is_round_robin_bo2_as_2xbo1: boolean }>
    >(query);

  return results;
};

export const getSeasonLeagueExternalIdById = async (
  id: number,
  connection?: PoolConnection
) => {
  const query = `SELECT * FROM SeasonLeagueExternalIds WHERE id = ?`;
  const [result] = await runQuery<Array<SeasonLeagueExternalId | undefined>>(
    query,
    [id],
    connection
  );
  return result;
};

export const updateSeasonLeagueExternalId = async (
  id: number,
  data: {
    external_id: string;
    external_league_name: string;
    stage_id: number;
    type: string;
    manual_group: Nullable<number>;
  },
  connection?: PoolConnection
) => {
  const query = `
    UPDATE SeasonLeagueExternalIds 
    SET 
      external_id = ?,
      external_league_name = ?,
      stage_id = ?,
      type = ?,
      manual_group = ?
    WHERE id = ?
  `;
  await runQuery(
    query,
    [
      data.external_id,
      data.external_league_name,
      data.stage_id,
      data.type,
      data.manual_group,
      id
    ],
    connection
  );
};

export const deleteSeasonLeagueExternalId = async (
  id: number,
  connection?: PoolConnection
) => {
  const query = `DELETE FROM SeasonLeagueExternalIds WHERE id = ?`;
  await runQuery(query, [id], connection);
};
