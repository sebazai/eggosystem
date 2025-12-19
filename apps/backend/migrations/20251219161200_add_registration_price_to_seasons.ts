import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("Seasons", (table: Knex.TableBuilder) => {
    table.decimal("registration_price", 10, 2).nullable();
    table.boolean("has_vat").defaultTo(true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("Seasons", (table: Knex.TableBuilder) => {
    table.dropColumn("registration_price");
    table.dropColumn("has_vat");
  });
}
