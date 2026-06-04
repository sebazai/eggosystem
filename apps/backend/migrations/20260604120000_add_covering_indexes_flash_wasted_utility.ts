import type { Knex } from "knex";

// Add composite covering indexes on FlashEvents and WastedUtilityEvents to
// make the per-season GROUP BY subqueries in the utility discipline leaderboard
// cheaper. Without these, every leaderboard page load triggers full table scans
// on both event tables across the entire season.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("FlashEvents", (table) => {
    table.index(["match_game_id", "thrower_steam_id"]);
  });

  await knex.schema.alterTable("WastedUtilityEvents", (table) => {
    table.index(["match_game_id", "thrower_steam_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("WastedUtilityEvents", (table) => {
    table.dropIndex(["match_game_id", "thrower_steam_id"]);
  });

  await knex.schema.alterTable("FlashEvents", (table) => {
    table.dropIndex(["match_game_id", "thrower_steam_id"]);
  });
}
