import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("PlayerStats", (table) => {
    table.unique(["game_id", "steam_id"]);
  });
  await knex.schema.alterTable("PlayerTrades", (table) => {
    table.unique(
      [
        "game_id",
        "trader_steam_id",
        "killer_steam_id",
        "victim_steam_id",
        "round_number"
      ],
      "playertrades_unique"
    );
  });
  await knex.schema.alterTable("TeamGameScores", (table) => {
    table.unique(["game_id", "team_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("PlayerStats", (table) => {
    table.dropUnique(["game_id", "steam_id"]);
  });
  await knex.schema.alterTable("PlayerTrades", (table) => {
    table.dropUnique(
      [
        "game_id",
        "trader_steam_id",
        "killer_steam_id",
        "victim_steam_id",
        "round_number"
      ],
      "playertrades_unique"
    );
  });
  await knex.schema.alterTable("TeamGameScores", (table) => {
    table.dropUnique(["game_id", "team_id"]);
  });
}
