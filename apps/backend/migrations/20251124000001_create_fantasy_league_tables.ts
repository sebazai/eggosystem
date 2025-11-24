import { type Knex } from "knex";

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  // FantasyTeams: User teams with budget tracking
  await knex.schema.createTable("FantasyTeams", (table: Knex.TableBuilder) => {
    table.increments("id").primary();
    table.bigInteger("steam_id").notNullable();
    table
      .integer("season_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("Seasons")
      .onDelete("CASCADE");
    table
      .integer("league_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("Leagues")
      .onDelete("CASCADE");
    table.string("team_name", 100);
    table.decimal("budget_remaining", 10, 2).notNullable().defaultTo(1000000);
    table.integer("total_points").notNullable().defaultTo(0);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    // Unique constraint: one team per user per season
    table.unique(["steam_id", "season_id"]);

    // Indexes for common queries
    table.index(["season_id", "league_id"]);
    table.index(["steam_id"]);
    table.index(["total_points"]);
  });

  // FantasyTeamPlayers: Player roster with roles and points
  await knex.schema.createTable(
    "FantasyTeamPlayers",
    (table: Knex.TableBuilder) => {
      table.increments("id").primary();
      table
        .integer("fantasy_team_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("FantasyTeams")
        .onDelete("CASCADE");
      table.bigInteger("steam_id").notNullable();
      table
        .enum("role", [
          "main_awp",
          "leader",
          "support",
          "entry_fragger",
          "defender",
          "hs_machine",
          "multi_fragger",
          "attacker",
          "camper",
          "stathunter",
          "noob",
          "eco_friendly",
          "flash_master",
          "clutch_player",
          "first_blood",
          "t_specialist",
          "ct_specialist",
          "anchor"
        ])
        .nullable();
      table.decimal("player_value", 10, 2).notNullable();
      table.integer("points_earned").notNullable().defaultTo(0);
      table.integer("individual_points").notNullable().defaultTo(0);
      table.integer("team_points").notNullable().defaultTo(0);
      table.integer("role_points").notNullable().defaultTo(0);
      table.timestamp("added_at").defaultTo(knex.fn.now());
      table.timestamp("removed_at").nullable();
      table.boolean("is_active").notNullable().defaultTo(true);

      // Indexes
      table.index(["fantasy_team_id", "is_active"]);
      table.index(["steam_id"]);
      table.index(["role"]);
      table.index(["points_earned"]);
    }
  );

  // FantasyPlayerValues: Current player values and tiers (updated after each match)
  await knex.schema.createTable(
    "FantasyPlayerValues",
    (table: Knex.TableBuilder) => {
      table.increments("id").primary();
      table.bigInteger("steam_id").notNullable();
      table
        .integer("season_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("Seasons")
        .onDelete("CASCADE");
      table
        .integer("league_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("Leagues")
        .onDelete("CASCADE");
      table.decimal("value", 10, 2).notNullable();
      table.enum("tier", ["bronze", "silver", "gold"]).notNullable();
      table.integer("week_number").notNullable().defaultTo(0); // 0 = match-based updates
      table.json("performance_stats").nullable(); // Store latest match stats snapshot
      table.timestamp("created_at").defaultTo(knex.fn.now());

      // Unique constraint: one current value per player per season
      // (removed week_number to allow match-based updates - always get latest by created_at)
      table.unique(["steam_id", "season_id"]);

      // Indexes
      table.index(["season_id", "league_id"]);
      table.index(["steam_id"]);
      table.index(["tier"]);
    }
  );

  // FantasyPlayerHistory: Audit trail for substitutions and changes
  await knex.schema.createTable(
    "FantasyPlayerHistory",
    (table: Knex.TableBuilder) => {
      table.increments("id").primary();
      table
        .integer("fantasy_team_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("FantasyTeams")
        .onDelete("CASCADE");
      table.bigInteger("steam_id").notNullable();
      table
        .enum("action", ["added", "removed", "role_changed", "points_updated"])
        .notNullable();
      table.json("old_value").nullable();
      table.json("new_value").nullable();
      table.integer("week_number").nullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());

      // Indexes
      table.index(["fantasy_team_id", "created_at"]);
      table.index(["steam_id"]);
      table.index(["action"]);
    }
  );

  // FantasyPointsLog: Detailed points history per match
  await knex.schema.createTable(
    "FantasyPointsLog",
    (table: Knex.TableBuilder) => {
      table.increments("id").primary();
      table
        .integer("fantasy_team_player_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("FantasyTeamPlayers")
        .onDelete("CASCADE");
      table
        .integer("match_game_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("MatchGames")
        .onDelete("CASCADE");
      table.integer("points_earned").notNullable();
      table.integer("individual_points").notNullable();
      table.integer("team_points").notNullable().defaultTo(0);
      table.integer("role_points").notNullable().defaultTo(0);
      table.json("stats_breakdown").nullable(); // Player stats from match: kills, deaths, assists, rating, etc.
      table.json("points_breakdown").nullable(); // Points calculation breakdown: kill_points, death_points, etc.
      table.timestamp("created_at").defaultTo(knex.fn.now());

      // Unique constraint: one entry per player per match
      table.unique(["fantasy_team_player_id", "match_game_id"]);

      // Indexes
      table.index(["fantasy_team_player_id"]);
      table.index(["match_game_id"]);
      table.index(["created_at"]);
    }
  );

  // FantasyLeaderboard: Weekly rankings snapshot
  await knex.schema.createTable(
    "FantasyLeaderboard",
    (table: Knex.TableBuilder) => {
      table.increments("id").primary();
      table
        .integer("fantasy_team_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("FantasyTeams")
        .onDelete("CASCADE");
      table
        .integer("season_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("Seasons")
        .onDelete("CASCADE");
      table
        .integer("league_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("Leagues")
        .onDelete("CASCADE");
      table.integer("rank").notNullable();
      table.integer("total_points").notNullable();
      table.integer("week_number").notNullable();
      table.timestamp("calculated_at").defaultTo(knex.fn.now());

      // Indexes for leaderboard queries
      table.index(["season_id", "league_id", "week_number", "rank"]);
      table.index(["fantasy_team_id", "week_number"]);
    }
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("FantasyLeaderboard");
  await knex.schema.dropTableIfExists("FantasyPointsLog");
  await knex.schema.dropTableIfExists("FantasyPlayerHistory");
  await knex.schema.dropTableIfExists("FantasyPlayerValues");
  await knex.schema.dropTableIfExists("FantasyTeamPlayers");
  await knex.schema.dropTableIfExists("FantasyTeams");
}
