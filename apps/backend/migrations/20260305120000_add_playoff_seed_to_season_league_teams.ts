import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonLeagueTeams", (table) => {
    table.tinyint("playoff_seed").unsigned().nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonLeagueTeams", (table) => {
    table.dropColumn("playoff_seed");
  });
}
