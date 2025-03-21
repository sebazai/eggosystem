import { type Team } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";
import { buildInsertQueryParts } from "../db/utils";

export const getTeams = async () => {
  return runQuery<Omit<Team, "email">[]>(
    "SELECT id, organization_id, name, team_logo FROM Teams"
  );
};

export const insertTeam = async (
  team: Partial<Team>,
  connection?: PoolConnection
) => {
  const { columns, placeholders, values } = buildInsertQueryParts(team);
  return runQuery<{ insertId: number }>(
    `INSERT INTO Teams (${columns.join(", ")}) VALUES (${placeholders})`,
    values,
    connection
  );
};
