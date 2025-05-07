import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Accounts", (table) => {
    table
      .boolean("is_work_email_personal_email")
      .notNullable()
      .defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Accounts", (table) => {
    table.dropColumn("is_work_email_personal_email");
  });
}
