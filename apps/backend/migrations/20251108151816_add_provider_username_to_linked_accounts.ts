import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add provider_username column to LinkedAccounts table
  await knex.schema.alterTable("LinkedAccounts", (table) => {
    table.string("provider_username", 255).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove provider_username column from LinkedAccounts
  await knex.schema.alterTable("LinkedAccounts", (table) => {
    table.dropColumn("provider_username");
  });
}
