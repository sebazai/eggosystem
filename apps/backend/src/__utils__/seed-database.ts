import { type InsertSeason } from "@eggosystem/types";
import { buildInsertQueryParts } from "../db/utils";
import { runQuery } from "../db/mysqlRunQuery";

export const insertSeason = (data: InsertSeason) => {
  const insertQuery = buildInsertQueryParts(data);
  return runQuery(
    `INSERT IGNORE INTO Seasons (${insertQuery.columns.join(", ")}) VALUES (${insertQuery.placeholders})`,
    insertQuery.values
  );
};
