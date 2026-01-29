import { type Knex } from "knex";

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(
    "PlayerClutches",
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
      table.enum("player_team", ["CT", "T"]).notNullable();
      table.boolean("won").notNullable();
      table.tinyint("clutch_start_enemies").unsigned().notNullable(); // 1-5
      table.tinyint("kills").unsigned().notNullable(); // Kills during clutch
      table.string("end_info", 32).notNullable(); // e.g. "Lost", "Kill"

      table.index(["match_game_id"]);
      table.index(["match_game_id", "round_number"]);
      table.index(["player_steam_id"]);

      table.unique(["match_game_id", "round_number", "player_steam_id"], {
        indexName: "player_clutches_unique_per_round"
      });
    }
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("PlayerClutches");
}
