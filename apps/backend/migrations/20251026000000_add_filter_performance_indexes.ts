import type { Knex } from "knex";

/**
 * Add indexes to improve filter query performance.
 * These indexes optimize the multi-filter intersection query that was taking 26+ seconds.
 */
export async function up(knex: Knex): Promise<void> {
  // Index on MatchTeams.team_id for efficient team-based joins
  await knex.raw(`
    CREATE INDEX idx_match_teams_team_id 
    ON MatchTeams (team_id, match_id)
  `);

  // Index on Matches.stage for stage filtering
  await knex.raw(`
    CREATE INDEX idx_matches_stage 
    ON Matches (stage)
  `);

  // Composite index on Matches for common filter combinations
  await knex.raw(`
    CREATE INDEX idx_matches_season_league_stage 
    ON Matches (season_id, league_id, stage)
  `);

  // Index on MatchGames for match_id and map_id filtering
  // (match_id already has FK index, but composite helps with both columns)
  await knex.raw(`
    CREATE INDEX idx_match_games_match_map 
    ON MatchGames (match_id, map_id)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP INDEX idx_match_teams_team_id ON MatchTeams");
  await knex.raw("DROP INDEX idx_matches_stage ON Matches");
  await knex.raw("DROP INDEX idx_matches_season_league_stage ON Matches");
  await knex.raw("DROP INDEX idx_match_games_match_map ON MatchGames");
}
