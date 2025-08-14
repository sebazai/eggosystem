import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonLeagueExternalIds", (table) => {
    table.string("external_league_name").after("external_id").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonLeagueExternalIds", (table) => {
    table.dropColumn("external_league_name");
  });
}
