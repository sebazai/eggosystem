import type { Knex } from "knex";

/**
 * Add additional indexes on SeasonTeamPlayers for filter query optimization.
 */
export async function up(knex: Knex): Promise<void> {
  // Index on SeasonTeamPlayers.steam_id for steamId filtering
  await knex.raw(`
    CREATE INDEX idx_season_team_players_steam_id 
    ON SeasonTeamPlayers (steam_id)
  `);

  // Composite index on SeasonTeamPlayers for common filter patterns
  await knex.raw(`
    CREATE INDEX idx_season_team_players_season_team 
    ON SeasonTeamPlayers (season_id, team_id)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    "DROP INDEX idx_season_team_players_steam_id ON SeasonTeamPlayers"
  );
  await knex.raw(
    "DROP INDEX idx_season_team_players_season_team ON SeasonTeamPlayers"
  );
}
