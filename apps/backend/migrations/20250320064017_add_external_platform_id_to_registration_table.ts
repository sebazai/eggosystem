import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // drop external_platform_id from SeasonTeamLeagues table
  await knex.schema.alterTable("SeasonLeagueTeams", (table) => {
    table.dropColumn("external_platform_id");
  });
  // add external_platform_id VARCHAR(255) to SeasonTeamRegistrations table
  await knex.schema.alterTable("SeasonTeamRegistrations", (table) => {
    table.string("external_platform_id", 255).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  // drop external_platform_id from SeasonTeamRegistrations table
  await knex.schema.alterTable("SeasonTeamRegistrations", (table) => {
    table.dropColumn("external_platform_id");
  });
  // add external_platform_id VARCHAR(255) to SeasonTeamLeagues table
  await knex.schema.alterTable("SeasonLeagueTeams", (table) => {
    table.string("external_platform_id", 255).nullable();
  });
}
