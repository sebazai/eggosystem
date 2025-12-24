import { type Knex } from "knex";

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("KillLogs", (table: Knex.TableBuilder) => {
    table.increments("id").primary();
    table
      .integer("match_game_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("MatchGames")
      .onDelete("CASCADE");
    table.integer("round_number").notNullable();
    table.decimal("time_in_round", 18, 6).notNullable(); // Seconds since round start (high precision)
    table.bigInteger("killer").notNullable(); // Steam ID
    table.enum("killer_team", ["CT", "T"]).notNullable();
    table.bigInteger("victim").notNullable(); // Steam ID
    table.enum("victim_team", ["CT", "T"]).notNullable();
    table.string("weapon", 64).notNullable();
    table.boolean("is_headshot").notNullable().defaultTo(false);
    table.boolean("is_penetration").notNullable().defaultTo(false); // Wall-bang
    table.boolean("is_first_kill").notNullable().defaultTo(false);
    table.tinyint("cts_alive_after").unsigned().notNullable(); // After this kill (0-5)
    table.tinyint("ts_alive_after").unsigned().notNullable(); // After this kill (0-5)
    table.boolean("bomb_planted").notNullable().defaultTo(false); // Was bomb planted at time of kill
    table.bigInteger("assister").nullable(); // Steam ID of assister (0 = no assist)
    table.boolean("is_flash_assist").notNullable().defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now());

    // Indexes for common queries
    table.index(["match_game_id"]);
    table.index(["match_game_id", "round_number"]);
    table.index(["killer"]);
    table.index(["victim"]);

    // Unique constraint: one kill event per match_game_id, round, time, killer, and victim
    // This prevents duplicate kill entries
    table.unique(
      ["match_game_id", "round_number", "killer", "victim", "time_in_round"],
      { indexName: "kill_logs_unique_kill_event" }
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("KillLogs");
}
