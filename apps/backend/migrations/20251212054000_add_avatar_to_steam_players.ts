import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SteamPlayers", (table) => {
    // Avatar stores the phash of the uploaded image from the image service
    table.string("avatar").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SteamPlayers", (table) => {
    table.dropColumn("avatar");
  });
}
