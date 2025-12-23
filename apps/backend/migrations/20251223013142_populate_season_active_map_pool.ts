import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Populate SeasonActiveMapPool with maps that were actually played in each season
  // This assumes that if a map was played in a season, it was part of the active pool
  await knex.raw(`
    INSERT INTO SeasonActiveMapPool (season_id, map_id)
    SELECT DISTINCT m.season_id, mg.map_id
    FROM MatchGames mg
    JOIN Matches m ON mg.match_id = m.id
    WHERE NOT EXISTS (
      SELECT 1 FROM SeasonActiveMapPool samp
      WHERE samp.season_id = m.season_id AND samp.map_id = mg.map_id
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Remove all entries populated from MatchGames
  // Note: This will remove all entries, including manually added ones
  // In a production scenario, you might want to be more selective
  await knex("SeasonActiveMapPool").del();
}
