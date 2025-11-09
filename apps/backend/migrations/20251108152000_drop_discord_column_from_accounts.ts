import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Delete all existing Discord LinkedAccounts rows so users need to re-link via OAuth
  await knex("LinkedAccounts").where("provider", "discord").del();

  // Drop discord column from Accounts table
  await knex.schema.alterTable("Accounts", (table) => {
    table.dropColumn("discord");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Re-add discord column to Accounts table
  await knex.schema.alterTable("Accounts", (table) => {
    table.string("discord", 255).nullable();
  });

  // Note: We don't restore Discord LinkedAccounts rows in down migration
  // as we don't have the data to restore them
}
