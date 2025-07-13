import { type Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Disable foreign key checks to allow dropping tables with dependencies
  await knex.raw("SET FOREIGN_KEY_CHECKS=0");

  // Drop all triggers
  const triggers = await knex.raw(
    "SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = ?",
    [process.env.DB_NAME ?? "kanaliiga"]
  );
  for (const row of triggers[0]) {
    await knex.raw(`DROP TRIGGER IF EXISTS \`${row.trigger_name}\``);
  }

  // Drop all functions
  const functions = await knex.raw(
    "SELECT routine_name FROM information_schema.routines WHERE routine_schema = ? AND routine_type = 'FUNCTION'",
    [process.env.DB_NAME ?? "kanaliiga"]
  );
  for (const row of functions[0]) {
    await knex.raw(`DROP FUNCTION IF EXISTS \`${row.routine_name}\``);
  }

  // Drop all procedures
  const procedures = await knex.raw(
    "SELECT routine_name FROM information_schema.routines WHERE routine_schema = ? AND routine_type = 'PROCEDURE'",
    [process.env.DB_NAME ?? "kanaliiga"]
  );
  for (const row of procedures[0]) {
    await knex.raw(`DROP PROCEDURE IF EXISTS \`${row.routine_name}\``);
  }

  // Get all table names from the database
  const tables = await knex.raw(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
    [process.env.DB_NAME ?? "kanaliiga"]
  );

  // Drop all tables
  for (const row of tables[0]) {
    const tableName = row.table_name;
    await knex.raw(`DROP TABLE IF EXISTS \`${tableName}\``);
  }

  // Re-enable foreign key checks
  await knex.raw("SET FOREIGN_KEY_CHECKS=1");
}
