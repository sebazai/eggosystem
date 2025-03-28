import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Make Table Season column platform enum with values "kanaliiga", "esportal", "faceit", "popflash"
  // and set default value to "kanaliiga"
  await knex.schema.alterTable("Seasons", (table) => {
    table
      .enu("platform", ["kanaliiga", "esportal", "faceit", "popflash"])
      .notNullable()
      .defaultTo("kanaliiga")
      .alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  // Revert the platform column back to string and remove not null constraint
  await knex.schema.alterTable("season", (table) => {
    table.string("platform").nullable().alter();
  });
}
