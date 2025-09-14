import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonTeamPlayers", (table) => {
    table.dropPrimary();
  });

  await knex.schema.alterTable("SeasonTeamPlayers", (table) => {
    table.increments("id").primary().first();
  });

  await knex.raw(`
    CREATE UNIQUE INDEX unique_season_team_player_match 
    ON SeasonTeamPlayers (season_id, team_id, steam_id, match_id)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX unique_season_team_player_match ON SeasonTeamPlayers
  `);

  await knex.schema.alterTable("SeasonTeamPlayers", (table) => {
    table.dropPrimary();
    table.dropColumn("id");
    table.primary(["season_id", "steam_id", "team_id"]);
  });
}
