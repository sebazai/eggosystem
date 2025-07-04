import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Drop external_id from SeasonLeagues
  await knex.schema.alterTable("SeasonLeagues", (table) => {
    table.dropColumn("external_id");
  });

  // Create Stages table
  await knex.schema.createTable("Stages", (table) => {
    table.increments("id").primary();
    table.string("name", 255).notNullable();
  });
  // Insert default stages
  await knex("Stages").insert([
    { id: 1, name: "Regular" },
    { id: 2, name: "Playoff" }
  ]);

  // Create SeasonLeagueExternalIds table
  await knex.schema.createTable("SeasonLeagueExternalIds", (table) => {
    table.increments("id").primary();
    table.integer("season_id").unsigned().notNullable();
    table.integer("league_id").unsigned().notNullable();
    table.integer("stage_id").unsigned().notNullable();
    table.string("external_id", 255).notNullable();
    table.string("type", 255).notNullable();
    table.boolean("isBO2PlayedAs2xBO1").notNullable();
    table
      .foreign("stage_id")
      .references("id")
      .inTable("Stages")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table
      .foreign(["season_id", "league_id"])
      .references(["season_id", "league_id"])
      .inTable("SeasonLeagues")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table.unique(["season_id", "league_id", "external_id"]);
  });

  // Alter Matches.stage to be a foreign key to Stages(id)
  await knex.schema.alterTable("Matches", (table) => {
    table.integer("stage").unsigned().notNullable().defaultTo(1).alter();
    table
      .foreign("stage")
      .references("id")
      .inTable("Stages")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop SeasonLeagueExternalIds table
  await knex.schema.dropTableIfExists("SeasonLeagueExternalIds");

  // Add external_id back to SeasonLeagues
  await knex.schema.alterTable("SeasonLeagues", (table) => {
    table.string("external_id", 255);
  });

  // Drop Stages table
  await knex.schema.dropTableIfExists("Stages");

  // Remove foreign key from Matches.stage
  await knex.schema.alterTable("Matches", (table) => {
    table.dropForeign(["stage"]);
    // Optionally revert to previous type/default if needed
    // table.specificType("stage", "TINYINT UNSIGNED").notNullable().defaultTo(2).alter();
  });
}
