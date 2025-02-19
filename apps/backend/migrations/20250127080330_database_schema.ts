/* eslint-disable @typescript-eslint/no-require-imports */
import * as fs from "fs";
import type { Knex } from "knex";
import { envConnection } from "./helpers/migrationsDbConnections";

export const config = { transaction: false };

// Import Games, Leagues, and Seasons tables
export async function up(): Promise<void> {
  const baseDbConfig = {
    client: "mysql2",
    connection: {
      ...envConnection,
      user: process.env.DB_ROOT_USER ?? "root",
      password: process.env.DB_ROOT_PASSWORD ?? "dev-pass",
      database: "kanaliiga",
    },
  };
  const knex = require("knex");
  const tempDb = knex(baseDbConfig);
  const base = fs.readFileSync("./dbdump/kanaliiga.sql", "utf8");
  const baseStatements = base.split(/;/).filter((stmt) => stmt.trim()); // Split SQL into individual statements

  for (const statement of baseStatements) {
    console.log("Executing:", statement); // Log each statement for debugging
    await tempDb.raw(statement);
  }
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw("DROP DATABASE IF EXISTS kanaliiga;");
}
