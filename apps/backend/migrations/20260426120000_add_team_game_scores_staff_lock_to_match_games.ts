import type { Knex } from "knex";

/**
 * When true, demo parse/reparse must not overwrite TeamGameScores for this map (staff manual authority).
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("MatchGames", (table) => {
    table.boolean("team_game_scores_staff_lock").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("MatchGames", (table) => {
    table.dropColumn("team_game_scores_staff_lock");
  });
}
