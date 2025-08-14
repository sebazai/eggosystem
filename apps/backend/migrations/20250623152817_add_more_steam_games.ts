import type { Knex } from "knex";

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  await knex.raw("UPDATE Games SET name = 'Counter-Strike 2' WHERE id = 1;");
  await knex.raw("UPDATE Games SET abbreviation = 'CS2' WHERE id = 1;");
  const newGames = [
    "INSERT IGNORE INTO Games (id, name, abbreviation, app_id) VALUES (2, 'PUBG: Battlegrounds', 'PUBG', 578080);",
    "INSERT IGNORE INTO Games (id, name, abbreviation, app_id) VALUES (3, 'Rocket League', 'RL', 252950);",
    "INSERT IGNORE INTO Games (id, name, abbreviation, app_id) VALUES (4, 'Dota 2', 'Dota', 570);"
  ];

  for (const gameInsert of newGames) {
    await knex.raw(gameInsert);
  }

  await knex.schema.createTable("GameTypes", (table: Knex.TableBuilder) => {
    table.increments("id").primary();
    table.integer("game_id").unsigned().notNullable();
    table.string("name").nullable();
    table.integer("min_players");
    table.integer("max_players");

    // Foreign key constraints with explicit shorter names
    table
      .foreign("game_id", "fk_game_types_game")
      .references("id")
      .inTable("Games")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
  });

  const insertQueries = [
    "INSERT IGNORE INTO GameTypes (game_id, name, min_players, max_players) VALUES (1, 'Comp', 5, 9);",
    "INSERT IGNORE INTO GameTypes (game_id, name, min_players, max_players) VALUES (1, 'Wingman', 2, 3);",
    "INSERT IGNORE INTO GameTypes (game_id, name, min_players, max_players) VALUES (2, 'Duo', 2, 3);",
    "INSERT IGNORE INTO GameTypes (game_id, name, min_players, max_players) VALUES (2, 'Squad', 3, 10);",
    "INSERT IGNORE INTO GameTypes (game_id, name, min_players, max_players) VALUES (3, 'Standard', 3, 5);",
    "INSERT IGNORE INTO GameTypes (game_id, name, min_players, max_players) VALUES (4, 'Team clash', 5, 7);"
  ];

  for (const query of insertQueries) {
    await knex.raw(query);
  }

  await knex.schema.alterTable("Seasons", (table) => {
    table
      .integer("game_type_id")
      .after("game_id")
      .unsigned()
      .references("id")
      .inTable("GameTypes")
      .onDelete("CASCADE");
  });
  await knex.raw("UPDATE Seasons SET game_type_id = 1");

  await knex.schema.createTable(
    "KanahautomoRegistrationGameTypes",
    (table: Knex.TableBuilder) => {
      table.integer("game_type_id").unsigned().notNullable();
      table.integer("kanahautomo_registration_id").unsigned().notNullable();

      // Foreign key constraints with explicit shorter names
      table
        .foreign("game_type_id", "fk_kana_reg_game_types_game_type")
        .references("id")
        .inTable("GameTypes")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");

      table
        .foreign("kanahautomo_registration_id", "fk_kana_reg_game_types_reg")
        .references("id")
        .inTable("KanahautomoRegistrations")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");

      table.primary(["game_type_id", "kanahautomo_registration_id"]);
    }
  );
}

export async function down(knex: Knex): Promise<void> {
  // Drop table
  await knex.schema.alterTable("Seasons", (table) => {
    table.dropForeign("game_type_id");
    table.dropColumn("game_type_id");
  });
  await knex.schema.dropTableIfExists("KanahautomoRegistrationGameTypes");
  await knex.schema.dropTableIfExists("GameTypes");
  await knex.raw("DELETE FROM Games WHERE id IN (2,3,4);");
}
