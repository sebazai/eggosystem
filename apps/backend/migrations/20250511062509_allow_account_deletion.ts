import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SteamPlayers", (table) => {
    table.dropForeign("account_id");
  });

  await knex.schema.alterTable("SteamPlayers", (table) => {
    table.integer("account_id").unsigned().nullable().alter();
  });

  await knex.schema.alterTable("SteamPlayers", (table) => {
    table
      .foreign("account_id")
      .references("id")
      .inTable("Accounts")
      .onDelete("SET NULL")
      .onUpdate("RESTRICT");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SteamPlayers", (table) => {
    table.dropForeign("account_id");
  });

  // Make the column NOT NULL again
  await knex.schema.alterTable("SteamPlayers", (table) => {
    table.integer("account_id").notNullable().alter();
  });

  // Re-add the original ON DELETE CASCADE constraint
  await knex.schema.alterTable("SteamPlayers", (table) => {
    table
      .foreign("account_id")
      .references("id")
      .inTable("Accounts")
      .onDelete("CASCADE");
  });
}
