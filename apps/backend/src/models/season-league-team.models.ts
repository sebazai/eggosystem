import { type SeasonLeagueTeam } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

export const getSeasonLeagueTeamByExternalId = async (
  externalId: string,
  connection?: PoolConnection
) => {
  const query = `SELECT * FROM SeasonLeagueTeams WHERE external_platform_id = ?`;
  const [seasonLeagueTeam] = await runQuery<
    Array<SeasonLeagueTeam | undefined>
  >(query, [externalId], connection);
  return seasonLeagueTeam;
};
