import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SteamPlayers", (table) => {
    table.string("faceit_nickname").nullable();
    table.string("faceit_id").nullable().unique();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SteamPlayers", (table) => {
    table.dropColumn("faceit_nickname");
    table.dropColumn("faceit_id");
  });
}
