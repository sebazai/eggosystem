import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("UserPolicyAcceptances", (table) => {
    table
      .boolean("accepted_newsletter")
      .notNullable()
      .defaultTo(true)
      .after("accepted_marketing");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("UserPolicyAcceptances", (table) => {
    table.dropColumn("accepted_newsletter");
  });
}
