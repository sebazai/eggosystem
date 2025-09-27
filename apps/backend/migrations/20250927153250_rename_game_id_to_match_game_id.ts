import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Rename game_id to match_game_id in all tables that reference MatchGames.id

  // 1. MapRoundStats table
  await knex.schema.alterTable("MapRoundStats", (table) => {
    table.renameColumn("game_id", "match_game_id");
  });

  // 2. MatchGameClips table
  await knex.schema.alterTable("MatchGameClips", (table) => {
    table.renameColumn("game_id", "match_game_id");
  });

  // 3. PlayerStats table
  await knex.schema.alterTable("PlayerStats", (table) => {
    table.renameColumn("game_id", "match_game_id");
  });

  // 4. PlayerTrades table
  await knex.schema.alterTable("PlayerTrades", (table) => {
    table.renameColumn("game_id", "match_game_id");
  });

  // 5. TeamGameScores table
  await knex.schema.alterTable("TeamGameScores", (table) => {
    table.renameColumn("game_id", "match_game_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Reverse the column renames: match_game_id back to game_id

  // 1. TeamGameScores table
  await knex.schema.alterTable("TeamGameScores", (table) => {
    table.renameColumn("match_game_id", "game_id");
  });

  // 2. PlayerTrades table
  await knex.schema.alterTable("PlayerTrades", (table) => {
    table.renameColumn("match_game_id", "game_id");
  });

  // 3. PlayerStats table
  await knex.schema.alterTable("PlayerStats", (table) => {
    table.renameColumn("match_game_id", "game_id");
  });

  // 4. MatchGameClips table
  await knex.schema.alterTable("MatchGameClips", (table) => {
    table.renameColumn("match_game_id", "game_id");
  });

  // 5. MapRoundStats table
  await knex.schema.alterTable("MapRoundStats", (table) => {
    table.renameColumn("match_game_id", "game_id");
  });
}
