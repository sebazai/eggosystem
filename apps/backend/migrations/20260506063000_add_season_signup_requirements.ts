// Migration to add signup requirement fields to Seasons table
import type { Knex } from "knex";

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  // Add the new boolean columns with default values of FALSE
  await knex.schema.table("Seasons", (table) => {
    table.boolean("faceit_rank_required").notNullable().defaultTo(false);
    table.boolean("premier_rank_required").notNullable().defaultTo(false);
    table.boolean("hours_played_required").notNullable().defaultTo(false);
  });

  // Existing seasons keep strict defaults (all requirements on). Organizers may turn flags off afterward.
  await knex("Seasons").update({
    faceit_rank_required: true,
    premier_rank_required: true,
    hours_played_required: true
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove the columns if migration is rolled back
  await knex.schema.table("Seasons", (table) => {
    table.dropColumn("faceit_rank_required");
    table.dropColumn("premier_rank_required");
    table.dropColumn("hours_played_required");
  });
}
