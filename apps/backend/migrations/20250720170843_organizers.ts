import type { Knex } from "knex";

// Kanaliiga
const faceitOrganizers = ["d2372a88-623d-4ca3-9248-a480b6dfbe1a"];

export async function up(knex: Knex): Promise<void> {
  // Create Organizers table
  await knex.schema.createTable("Organizers", (table) => {
    table.increments("id").primary();
    table.string("name", 255).notNullable();
    table.string("faceit_id", 255).unique();
    table.timestamps(true, true); // Adds created_at and updated_at
  });

  // Create OrganizerGames junction table for many-to-many relationship
  await knex.schema.createTable("OrganizerGames", (table) => {
    table.increments("id").primary();
    table.integer("organizer_id").unsigned().notNullable();
    table.integer("game_id").unsigned().notNullable();
    table.timestamps(true, true); // Adds created_at and updated_at

    // Foreign key constraints
    table
      .foreign("organizer_id")
      .references("id")
      .inTable("Organizers")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    table
      .foreign("game_id")
      .references("id")
      .inTable("Games")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    // Unique constraint to prevent duplicate organizer-game combinations
    table.unique(["organizer_id", "game_id"]);
  });

  // Insert the Kanaliiga organizer
  const [organizerId] = await knex("Organizers").insert({
    name: "Kanaliiga",
    faceit_id: faceitOrganizers[0]
  });

  // Get all games from the database
  const games = await knex("Games").select("id");

  // Create many-to-many relationships with all games
  const organizerGameRelations = games.map((game) => ({
    organizer_id: organizerId,
    game_id: game.id
  }));

  if (organizerGameRelations.length > 0) {
    await knex("OrganizerGames").insert(organizerGameRelations);
  }
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order (junction table first)
  await knex.schema.dropTableIfExists("OrganizerGames");
  await knex.schema.dropTableIfExists("Organizers");
}
