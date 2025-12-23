import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Seasons", (table: Knex.TableBuilder) => {
    table.timestamp("signup_start_date").nullable().alter();
    table.timestamp("signup_end_date").nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Seasons", (table: Knex.TableBuilder) => {
    table.datetime("signup_start_date").nullable().alter();
    table.datetime("signup_end_date").nullable().alter();
  });
}
