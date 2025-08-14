import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonPlayerRanks", (table) => {
    table.integer("kana_elo").nullable().defaultTo(null).alter();
  });
  await knex.raw(
    "UPDATE SeasonPlayerRanks SET kana_elo = NULL WHERE kana_elo = 0"
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonPlayerRanks", (table) => {
    table.integer("kana_elo").nullable().defaultTo(0).alter();
  });
}
