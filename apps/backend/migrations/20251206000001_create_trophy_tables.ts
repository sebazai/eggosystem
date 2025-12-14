import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create Trophies table (trophy definitions)
  await knex.schema.createTable("Trophies", (table) => {
    table.increments("id").unsigned().primary();
    table.string("name", 100).notNullable().unique(); // e.g., "season_winner", "kanarating_top3"
    table.string("display_name", 255).notNullable(); // e.g., "{league} Winner"
    table.string("image_phash", 255).nullable(); // Image service phash identifier
    table.tinyint("placement").unsigned().nullable(); // 1=winner, 2=2nd, 3=3rd
    table
      .enum("category", ["season_placement", "kanarating", "special"])
      .notNullable()
      .defaultTo("season_placement");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // Create TrophyAssignments table (trophy instances)
  // Note: Either team_id OR steam_id should be set (not both) - enforced at application level
  // Team trophies (season placements) are assigned to teams
  // Player trophies (kanarating) are assigned to players directly
  await knex.schema.createTable("TrophyAssignments", (table) => {
    table.increments("id").unsigned().primary();
    table
      .integer("trophy_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("Trophies")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table
      .integer("team_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("Teams")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table
      .bigint("steam_id")
      .nullable()
      .references("steam_id")
      .inTable("SteamPlayers")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table
      .integer("season_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("Seasons")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table
      .integer("league_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("Leagues")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table.string("custom_text", 255).nullable(); // Optional override text
    table.timestamp("created_at").defaultTo(knex.fn.now());

    // Indexes for common queries
    table.index(["team_id", "season_id"], "idx_trophy_assignments_team_season");
    table.index(
      ["steam_id", "season_id"],
      "idx_trophy_assignments_player_season"
    );

    // Unique constraint: one trophy per team per season per league
    table.unique(
      ["trophy_id", "team_id", "season_id", "league_id"],
      "uk_trophy_team_season_league"
    );
  });

  // Seed initial trophy types with image phashes
  await knex("Trophies").insert([
    {
      name: "season_winner",
      display_name: "{league} Winner",
      image_phash: "cdc33b3c160c3b1e",
      placement: 1,
      category: "season_placement"
    },
    {
      name: "season_2nd",
      display_name: "{league} 2nd Place",
      image_phash: "cdc33b38065c3b4e",
      placement: 2,
      category: "season_placement"
    },
    {
      name: "season_3rd",
      display_name: "{league} 3rd Place",
      image_phash: "cfc3323c360c3b1e",
      placement: 3,
      category: "season_placement"
    },
    {
      name: "kanarating_top1",
      display_name: "{league} Kanarating #1",
      image_phash: "96b067e73c69491a",
      placement: 1,
      category: "kanarating"
    },
    {
      name: "kanarating_top2",
      display_name: "{league} Kanarating #2",
      image_phash: "95b4674e58435b9a",
      placement: 2,
      category: "kanarating"
    },
    {
      name: "kanarating_top3",
      display_name: "{league} Kanarating #3",
      image_phash: "909771634f78499b",
      placement: 3,
      category: "kanarating"
    }
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("TrophyAssignments");
  await knex.schema.dropTableIfExists("Trophies");
}
