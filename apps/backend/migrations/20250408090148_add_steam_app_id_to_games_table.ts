import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Games", function (table) {
    table.integer("steam_app_id").after("abbreviation").nullable();
  });

  // We only have CS...
  await knex("Games").update({ steam_app_id: 730 });

  await knex.schema.alterTable("Games", function (table) {
    table.integer("steam_app_id").notNullable().alter(); // Make it notNullable
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("Games", function (table) {
    table.dropColumn("steam_app_id");
  });
}
