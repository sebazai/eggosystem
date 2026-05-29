import type { Knex } from "knex";

// KanaRating 3.2: new event log tables for flash, round swing, setup chains,
// wasted utility, and per-round utility summaries.
export async function up(knex: Knex): Promise<void> {
  // ── FlashEvents ────────────────────────────────────────────────────────────
  // One row per PlayerFlashed event. Powers flash matrix and support analysis.
  await knex.schema.createTable("FlashEvents", (table) => {
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
    table.bigInteger("victim_steam_id").notNullable();
    table.string("victim_team", 2).notNullable().comment("CT or T");
    table.decimal("duration_seconds", 6, 3).notNullable();
    table.boolean("is_enemy_flash").notNullable().defaultTo(false);
    table.boolean("is_teammate_flash").notNullable().defaultTo(false);
    table.boolean("is_self_flash").notNullable().defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.index(["match_game_id"]);
    table.index(["match_game_id", "round_number"]);
    // Flash matrix: group by thrower×victim across many matches
    table.index(["thrower_steam_id", "victim_steam_id"]);
  });

  // ── RoundSwingEvents ───────────────────────────────────────────────────────
  // Win-probability delta on each kill. Powers the IGL round-review timeline.
  // Contributors stored as JSON to avoid a join for the primary use case.
  await knex.schema.createTable("RoundSwingEvents", (table) => {
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
    table
      .string("event_type", 32)
      .notNullable()
      .comment("kill | plant | defuse");
    table.decimal("pre_win_prob", 5, 4).notNullable();
    table.decimal("post_win_prob", 5, 4).notNullable();
    table
      .decimal("delta", 5, 4)
      .notNullable()
      .comment("Signed change; positive = CT favoured");
    table
      .bigInteger("primary_player_steam_id")
      .notNullable()
      .comment("Killer / primary actor");
    table
      .json("contributors")
      .nullable()
      .comment(
        "Array of {steam_id, contribution} — contribution is share of delta (0-1)"
      );
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.index(["match_game_id"]);
    table.index(["match_game_id", "round_number"]);
    table.index(["primary_player_steam_id"]);
  });

  // ── SetupEvents ────────────────────────────────────────────────────────────
  // Explicit flash→kill and utility-damage→kill chains.
  // Powers support-player report and exec review.
  await knex.schema.createTable("SetupEvents", (table) => {
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
    table
      .string("setup_type", 32)
      .notNullable()
      .comment("flash | utility_damage");
    table.bigInteger("setup_player_steam_id").notNullable();
    table.bigInteger("beneficiary_steam_id").notNullable();
    table.bigInteger("victim_steam_id").notNullable();
    table
      .decimal("seconds_after_setup", 6, 3)
      .notNullable()
      .comment("Seconds between setup event and kill");
    table
      .decimal("flash_duration", 6, 3)
      .nullable()
      .comment("Flash blind duration when setup_type = flash");
    table
      .smallint("damage_dealt")
      .unsigned()
      .nullable()
      .comment("Utility damage dealt when setup_type = utility_damage");
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.index(["match_game_id"]);
    // Support↔fragger pair aggregation
    table.index(["setup_player_steam_id", "beneficiary_steam_id"]);
  });

  // ── WastedUtilityEvents ────────────────────────────────────────────────────
  // Individual wasted grenades. Powers utility-discipline coaching view.
  await knex.schema.createTable("WastedUtilityEvents", (table) => {
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
    table
      .string("utility_type", 16)
      .notNullable()
      .comment("HE | Molotov | Incendiary");
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.index(["match_game_id"]);
    table.index(["match_game_id", "round_number"]);
    table.index(["thrower_steam_id"]);
  });

  // ── RoundUtilitySummary ────────────────────────────────────────────────────
  // Per-round per-player utility rollup. Powers round-by-round utility charts.
  await knex.schema.createTable("RoundUtilitySummary", (table) => {
    table
      .integer("match_game_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("MatchGames")
      .onDelete("CASCADE");
    table.tinyint("round_number").unsigned().notNullable();
    table.bigInteger("steam_id").notNullable();
    table.smallint("flashes_thrown").unsigned().notNullable().defaultTo(0);
    table.smallint("enemies_flashed").unsigned().notNullable().defaultTo(0);
    table.smallint("teammates_flashed").unsigned().notNullable().defaultTo(0);
    table.smallint("smokes_thrown").unsigned().notNullable().defaultTo(0);
    table.smallint("utility_damage").unsigned().notNullable().defaultTo(0);
    table.smallint("wasted_utility").unsigned().notNullable().defaultTo(0);
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.primary(["match_game_id", "round_number", "steam_id"]);
    table.index(["match_game_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("RoundUtilitySummary");
  await knex.schema.dropTableIfExists("WastedUtilityEvents");
  await knex.schema.dropTableIfExists("SetupEvents");
  await knex.schema.dropTableIfExists("RoundSwingEvents");
  await knex.schema.dropTableIfExists("FlashEvents");
}
