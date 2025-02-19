import * as fs from "fs";
import type { Knex } from "knex";

export const config = { transaction: false };

// Import Games, Leagues, and Seasons tables
export async function up(knex: Knex): Promise<void> {
  const base = fs.readFileSync("./dbdump/kanaliiga.sql", "utf8");
  const baseStatements = base.split(";").filter((stmt) => stmt.trim()); // Split SQL into individual statements

  for (const statement of baseStatements) {
    console.log("Executing:", statement); // Log each statement for debugging
    await knex.raw(statement);
  }
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw("DROP DATABASE IF EXISTS kanaliiga;");
}
