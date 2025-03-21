import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add to Teams table a column called org_approved
  // that is a boolean and defaults to false
  await knex.schema.table("Teams", (table) => {
    table.boolean("org_approved").defaultTo(false);
  });
  // Set true for all current teams that have organization_id
  await knex("Teams")
    .whereNotNull("organization_id")
    .update({ org_approved: true });
}

export async function down(knex: Knex): Promise<void> {
  // Remove the org_approved column from Teams table
  await knex.schema.table("Teams", (table) => {
    table.dropColumn("org_approved");
  });
}
