import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("UserPolicyAcceptances", (table) => {
    table.string("newsletter_unsubscribe_token", 64).nullable().unique();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("UserPolicyAcceptances", (table) => {
    table.dropColumn("newsletter_unsubscribe_token");
  });
}
