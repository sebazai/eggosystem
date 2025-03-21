import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Drop column "email" from "Teams" table
  await knex.schema.table("Teams", (table) => {
    table.dropColumn("email");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Add column "email" to "Teams" table
  await knex.schema.table("Teams", (table) => {
    table.string("email").nullable();
  });
}
