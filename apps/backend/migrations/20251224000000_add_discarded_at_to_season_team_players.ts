import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonTeamPlayers", (table) => {
    // Soft delete timestamp - when the player was discarded from the team
    table.timestamp("discarded_at").nullable();

    // Account ID of the user who discarded the player (not a foreign key)
    table.integer("discarded_by").unsigned().nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonTeamPlayers", (table) => {
    table.dropColumn("discarded_at");
    table.dropColumn("discarded_by");
  });
}
