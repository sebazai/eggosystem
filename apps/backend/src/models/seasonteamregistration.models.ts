import type { PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { buildInsertQueryParts } from "../db/utils";
import type { InsertSeasonTeamRegistration } from "@eggosystem/types";

export const insertSeasonTeamRegistration = async (
  data: InsertSeasonTeamRegistration,
  connection?: PoolConnection
) => {
  const { columns, placeholders, values } = buildInsertQueryParts(data);
  return runQuery<{ insertId: number }>(
    `INSERT INTO SeasonTeamRegistrations (${columns.join(", ")}) VALUES (${placeholders})`,
    values,
    connection
  );
};
