import {
  type TeamWithExternalData,
  type SeasonLeagueTeam
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

export const getSeasonLeagueTeamByExternalId = async (
  externalId: string,
  seasonId: number,
  connection?: PoolConnection
) => {
  const query = `SELECT * FROM SeasonLeagueTeams WHERE external_team_id = ? AND season_id = ?`;
  const [seasonLeagueTeam] = await runQuery<
    Array<SeasonLeagueTeam | undefined>
  >(query, [externalId, seasonId], connection);
  return seasonLeagueTeam;
};

export const getSeasonLeagueTeamsBySeasonLeagueExternalId = async (
  seasonLeagueExternalId: string,
  seasonId: number,
  leagueId: number,
  connection?: PoolConnection
) => {
  const query = `SELECT slt.external_team_id, t.name FROM SeasonLeagueTeams slt
    JOIN Teams t ON slt.team_id = t.id
    WHERE slt.external_team_id = ? AND slt.season_id = ? AND slt.league_id = ?`;
  const [seasonLeagueTeams] = await runQuery<
    Array<TeamWithExternalData | undefined>
  >(query, [seasonLeagueExternalId, seasonId, leagueId], connection);
  return seasonLeagueTeams;
};
