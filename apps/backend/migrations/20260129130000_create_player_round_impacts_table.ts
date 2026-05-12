import { type Knex } from "knex";

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(
    "PlayerRoundImpacts",
    (table: Knex.TableBuilder) => {
      table.increments("id").primary();
      table
        .integer("match_game_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("MatchGames")
        .onDelete("CASCADE");
      table.integer("round_number").notNullable();
      table.bigInteger("player_steam_id").notNullable();
      table.tinyint("kills").unsigned().notNullable();
      table.tinyint("assists").unsigned().notNullable();
      table.boolean("first_kill").notNullable();
      table.tinyint("trades").unsigned().notNullable();
      table.integer("damage_dealt").unsigned().notNullable(); // Damage dealt this round (not ADR)
      table.tinyint("flash_assists").unsigned().notNullable();
      table.tinyint("first_kill_flash_assists").unsigned().notNullable();
      table.decimal("impact_score", 10, 6).notNullable();
      table.boolean("entry_kill").notNullable();
      table.boolean("exit_kill").notNullable();
      table.boolean("bomb_planted").notNullable();
      table.boolean("bomb_defused").notNullable();
      table.boolean("bomb_exploded").notNullable();
      table.decimal("kill_opponent_value", 10, 6).notNullable();
      table.decimal("win_prob_impact", 10, 6).notNullable();
      table.tinyint("trade_denials").unsigned().notNullable().defaultTo(0);
      table.tinyint("failed_trades").unsigned().notNullable().defaultTo(0);
      table.decimal("trade_efficiency", 5, 4).notNullable().defaultTo(0);

      table.index(["match_game_id"]);
      table.index(["match_game_id", "round_number"]);
      table.index(["player_steam_id"]);

      table.unique(["match_game_id", "round_number", "player_steam_id"], {
        indexName: "player_round_impacts_unique_per_round"
      });
    }
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("PlayerRoundImpacts");
}
