import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Matches", (table) => {
    table.time("end_time").nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Matches", (table) => {
    table.time("end_time").notNullable().alter();
  });
}
