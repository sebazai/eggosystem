import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizations", function (table) {
    table.unique("name");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizations", function (table) {
    table.dropUnique(["name"]);
  });
}
