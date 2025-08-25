import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonTeamPlayers", (table) => {
    table.foreign("team_id").references("id").inTable("Teams");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonTeamPlayers", (table) => {
    table.dropForeign("team_id");
  });
}
