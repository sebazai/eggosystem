import * as fs from "fs";
import type { Knex } from "knex";

export const config = { transaction: false };

// Import Games, Leagues, and Seasons tables
export async function up(knex: Knex): Promise<void> {
  const base = fs.readFileSync("./seeds/base.sql", "utf8");
  const baseStatements = base.split(";").filter((stmt) => stmt.trim()); // Split SQL into individual statements

  for (const statement of baseStatements) {
    console.log("Executing:", statement); // Log each statement for debugging
    await knex.raw(statement);
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("SET foreign_key_checks = 0");
  await knex.raw("TRUNCATE TABLE SeasonLeagues");
  await knex.raw("TRUNCATE TABLE Seasons");
  await knex.raw("TRUNCATE TABLE Games");
  await knex.raw("SET foreign_key_checks = 1");
}
