import type { PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import type { InsertSeasonTeamPlayer } from "@eggosystem/types";
import { buildInsertQueryParts } from "../db/utils";

export const insertSeasonTeamPlayer = async (
  data: InsertSeasonTeamPlayer,
  connection?: PoolConnection
) => {
  const { columns, placeholders, values } = buildInsertQueryParts(data);
  return runQuery<{ insertId: number }>(
    `INSERT INTO SeasonTeamPlayers (${columns.join(", ")}) VALUES (${placeholders})`,
    values,
    connection
  );
};
