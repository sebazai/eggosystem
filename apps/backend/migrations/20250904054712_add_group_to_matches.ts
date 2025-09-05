import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add group column to Matches table if it doesn't exist
  const hasGroupColumn = await knex.schema.hasColumn("Matches", "group");
  if (!hasGroupColumn) {
    await knex.schema.alterTable("Matches", (table) => {
      table.string("group").nullable();
    });
  }

  // Note: To populate group data, use the /api/v1/temp/populate-faceit-data endpoint
  // This migration only ensures the schema is ready
}

export async function down(_knex: Knex): Promise<void> {
  // NO-OP
}
