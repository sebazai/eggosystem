import { type Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Disable foreign key checks to allow dropping tables with dependencies
  await knex.raw("SET FOREIGN_KEY_CHECKS=0");

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
