import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table("SeasonTeamPlayers", (table) => {
    table.boolean("employment_approved_by_organizer");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table("SeasonTeamPlayers", (table) => {
    table.dropColumn("employment_approved_by_organizer");
  });
}
