import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonLeagueTeams", (table) => {
    table.string("external_team_id").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonLeagueTeams", (table) => {
    table.dropColumn("external_team_id");
  });
}
