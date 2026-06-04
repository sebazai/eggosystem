import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("SteamPlayerKanaElo");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.createTableIfNotExists("SteamPlayerKanaElo", (table) => {
    table.string("steam_id", 20).primary();
    table.integer("kana_elo").unsigned().notNullable().defaultTo(0);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}
