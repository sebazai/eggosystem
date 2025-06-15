import type { PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import type {
  InsertSeasonTeamPlayer,
  SeasonPlayerApprovals
} from "@eggosystem/types";
import { buildInsertQueryParts } from "../db/utils";

export const insertSeasonTeamPlayer = async (
  seasonId: number,
  teamId: number,
  data: InsertSeasonTeamPlayer,
  connection?: PoolConnection
) => {
  const { columns, placeholders, values } = buildInsertQueryParts(data);
  return runQuery<{ insertId: number }>(
    `INSERT INTO SeasonTeamPlayers (season_id, team_id, ${columns.join(", ")}) VALUES (?, ?, ${placeholders})`,
    [seasonId, teamId, ...values],
    connection
  );
};

export const isPlayerApprovedForSeasonManually = async (
  season_id: number,
  steam_id: string,
  team_id?: number,
  organization_id?: number
) => {
  if (!team_id && !organization_id) {
    throw new Error("Either team_id or organization_id must be provided");
  }
  const [result] = await runQuery<Array<SeasonPlayerApprovals>>(
    `SELECT spa.* 
     FROM SeasonPlayerApprovals spa 
      WHERE spa.season_id = ? AND spa.steam_id = ? AND (spa.team_id = ? OR spa.organization_id = ?)`,
    [season_id, steam_id, team_id ?? null, organization_id ?? null]
  );
  if (!result) {
    return { approved_by_organizer: false };
  }
  return {
    approved_by_organizer: !!result
  };
};
