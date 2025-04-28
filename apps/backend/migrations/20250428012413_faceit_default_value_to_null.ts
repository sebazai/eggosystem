import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonPlayerRanks", (table) => {
    table.integer("faceit_elo").nullable().defaultTo(null).alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonPlayerRanks", (table) => {
    table.integer("faceit_elo").notNullable().defaultTo(800).alter();
  });
}
