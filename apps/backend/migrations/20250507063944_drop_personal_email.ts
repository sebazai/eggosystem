import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Accounts", (table) => {
    table.dropColumn("email_verified");
    table.dropColumn("email_token");
    table.dropColumn("email_token_expires_at");
    table.dropColumn("email");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Accounts", (table) => {
    table.boolean("email_verified").notNullable().defaultTo(false);
    table.string("email_token", 255).nullable();
    table.timestamp("email_token_expires_at").nullable();
    table.string("email", 255).nullable();
  });
}
