import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Drop employment_approved_by_organizer column from SeasonTeamPlayers table
  await knex.schema.alterTable("SeasonTeamPlayers", (table) => {
    table.dropColumn("employment_approved_by_organizer");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Add employment_approved_by_organizer column to SeasonTeamPlayers table
  await knex.schema.alterTable("SeasonTeamPlayers", (table) => {
    table
      .boolean("employment_approved_by_organizer")
      .notNullable()
      .defaultTo(false);
  });
}
