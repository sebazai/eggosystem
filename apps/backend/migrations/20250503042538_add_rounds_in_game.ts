import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("MatchGames", (table) => {
    table.tinyint("regulation_rounds").unsigned().nullable();
  });

  await knex.raw(`
    UPDATE MatchGames mg
    JOIN Matches m ON m.id = mg.match_id
    SET mg.regulation_rounds = 24
    WHERE m.season_id IN (12, 13, 14, 15)
  `);

  await knex.raw(`
    UPDATE MatchGames mg
    JOIN Matches m ON m.id = mg.match_id
    SET mg.regulation_rounds = 30
    WHERE m.season_id NOT IN (12, 13, 14, 15)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("MatchGames", (table) => {
    table.dropColumn("regulation_rounds");
  });
}
