import { type Knex } from "knex";

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  // GlobalPlayerPoints: Track total fantasy points for ALL players (not just fantasy team players)
  await knex.schema.createTable(
    "GlobalPlayerPoints",
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
      table.integer("total_points").notNullable().defaultTo(0);
      table.integer("individual_points").notNullable().defaultTo(0);
      table.integer("team_points").notNullable().defaultTo(0);
      table.timestamp("updated_at").defaultTo(knex.fn.now());

      // Unique constraint: one entry per player per season
      table.unique(["steam_id", "season_id"]);

      // Indexes for common queries
      table.index(["season_id"]);
      table.index(["steam_id"]);
      table.index(["total_points"]);
    }
  );

  // GlobalPlayerPointsLog: Detailed points history per match for ALL players
  await knex.schema.createTable(
    "GlobalPlayerPointsLog",
    (table: Knex.TableBuilder) => {
      table.increments("id").primary();
      table.bigInteger("steam_id").notNullable();
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
      table.json("stats_breakdown").nullable(); // Player stats from match: kills, deaths, assists, rating, etc.
      table.json("points_breakdown").nullable(); // Points calculation breakdown: kill_points, death_points, etc.
      table.timestamp("created_at").defaultTo(knex.fn.now());

      // Unique constraint: one entry per player per match
      table.unique(["steam_id", "match_game_id"]);

      // Indexes
      table.index(["steam_id"]);
      table.index(["match_game_id"]);
      table.index(["created_at"]);
    }
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("GlobalPlayerPointsLog");
  await knex.schema.dropTableIfExists("GlobalPlayerPoints");
}
