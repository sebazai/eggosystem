import type { Knex } from "knex";

// Per-throw utility events (smoke, HE, molotov) from parser UtilityThrowLog.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("UtilityThrowEvents", (table) => {
    table.bigIncrements("id").primary();
    table
      .integer("match_game_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("MatchGames")
      .onDelete("CASCADE");
    table.tinyint("round_number").unsigned().notNullable();
    table.decimal("time_in_round", 7, 3).notNullable();
    table.bigInteger("thrower_steam_id").notNullable();
    table.string("thrower_team", 2).notNullable().comment("CT or T");
    table
      .string("utility_type", 32)
      .notNullable()
      .comment("smoke | he | molotov");
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.index(["match_game_id"]);
    table.index(["match_game_id", "round_number"]);
    table.index(["thrower_steam_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("UtilityThrowEvents");
}
