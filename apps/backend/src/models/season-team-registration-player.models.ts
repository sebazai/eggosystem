import { type InsertSeasonTeamRegistrationPlayer } from "@eggosystem/types";
import type { PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { buildInsertQueryParts } from "../db/utils";

export const insertSeasonTeamRegistrationPlayer = async (
  seasonId: number,
  teamId: number,
  data: InsertSeasonTeamRegistrationPlayer,
  connection?: PoolConnection
) => {
  const { columns, placeholders, values } = buildInsertQueryParts(data);
  return runQuery<{ insertId: number }>(
    `INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, ${columns.join(", ")}) VALUES (?, ?, ${placeholders})`,
    [seasonId, teamId, ...values],
    connection
  );
};

export const upsertSeasonTeamRegistrationPlayer = async (
  seasonId: number,
  teamId: number,
  data: InsertSeasonTeamRegistrationPlayer,
  connection?: PoolConnection
) => {
  const { columns, placeholders, values } = buildInsertQueryParts(data);
  return runQuery<{ insertId: number }>(
    `INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, ${columns.join(", ")}) VALUES (?, ?, ${placeholders})
     ON DUPLICATE KEY UPDATE 
       is_captain = VALUES(is_captain),
       is_co_captain = VALUES(is_co_captain)`,
    [seasonId, teamId, ...values],
    connection
  );
};
