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
