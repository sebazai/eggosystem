import type { PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import type { InsertSeasonTeamPlayer } from "@eggosystem/types";
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
