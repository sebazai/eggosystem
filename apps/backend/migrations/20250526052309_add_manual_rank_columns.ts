import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonPlayerRanks", (table) => {
    table.boolean("manual_external_rank").notNullable().defaultTo(false);
    table.boolean("manual_steam_rank").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonPlayerRanks", (table) => {
    table.dropColumn("manual_external_rank");
    table.dropColumn("manual_steam_rank");
  });
}
