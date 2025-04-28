import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Accounts", (table) => {
    table.boolean("email_verified").notNullable().defaultTo(false);
    table.boolean("work_email_verified").notNullable().defaultTo(false);
    table.string("email_token", 255).nullable();
    table.timestamp("email_token_expires_at").nullable();
    table.string("work_email_token", 255).nullable();
    table.timestamp("work_email_token_expires_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Accounts", (table) => {
    table.dropColumn("email_verified");
    table.dropColumn("work_email_verified");
    table.dropColumn("email_token");
    table.dropColumn("email_token_expires_at");
    table.dropColumn("work_email_token");
    table.dropColumn("work_email_token_expires_at");
  });
}
