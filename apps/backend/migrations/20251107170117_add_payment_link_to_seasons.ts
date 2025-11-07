import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("Seasons", (table: Knex.TableBuilder) => {
    table.string("payment_link", 500).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("Seasons", (table: Knex.TableBuilder) => {
    table.dropColumn("payment_link");
  });
}
