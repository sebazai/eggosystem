import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Drop the existing foreign key constraint
  await knex.schema.alterTable("SteamPlayerKanaElo", (table) => {
    table.dropForeign(["steam_id"]);
  });

  // Recreate the foreign key constraint with cascade options
  await knex.schema.alterTable("SteamPlayerKanaElo", (table) => {
    table
      .foreign("steam_id")
      .references("steam_id")
      .inTable("SteamPlayers")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop the cascade foreign key constraint
  await knex.schema.alterTable("SteamPlayerKanaElo", (table) => {
    table.dropForeign(["steam_id"]);
  });

  // Recreate the original foreign key constraint without cascade
  await knex.schema.alterTable("SteamPlayerKanaElo", (table) => {
    table.foreign("steam_id").references("steam_id").inTable("SteamPlayers");
  });
}
