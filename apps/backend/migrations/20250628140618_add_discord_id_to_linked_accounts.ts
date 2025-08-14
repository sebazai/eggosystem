import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add 'discord' to the provider enum in LinkedAccounts table
  await knex.schema.alterTable("LinkedAccounts", (table) => {
    // Drop the existing enum constraint and recreate it with 'discord' added
    table.enu("provider", ["steam", "discord"]).notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove Discord links from LinkedAccounts
  await knex("LinkedAccounts").where("provider", "discord").del();

  // Revert the provider enum back to only 'steam'
  await knex.schema.alterTable("LinkedAccounts", (table) => {
    table.enu("provider", ["steam"]).notNullable().alter();
  });
}
