import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add Discord user ID to Accounts table
  await knex.schema.alterTable("Accounts", (table) => {
    table.string("discord_user_id", 255).nullable().after("discord");
    table.index("discord_user_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove Discord user ID from Accounts table
  await knex.schema.alterTable("Accounts", (table) => {
    table.dropIndex("discord_user_id");
    table.dropColumn("discord_user_id");
  });
}
