import type { Knex } from "knex";

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("SeasonSignupSettings", (table) => {
    table
      .integer("season_id")
      .unsigned()
      .primary()
      .references("id")
      .inTable("Seasons")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table.integer("min_players").unsigned().nullable();
    table.integer("max_players").unsigned().nullable();
    table.timestamps(true, true);
  });

  await knex.raw(`
    INSERT INTO SeasonSignupSettings (season_id, min_players, max_players)
    SELECT s.id, gt.min_players, gt.max_players
    FROM Seasons s
    INNER JOIN GameTypes gt ON s.game_type_id = gt.id
  `);

  await knex.schema.alterTable("SeasonSignupSettings", (table) => {
    table.integer("min_players").unsigned().notNullable().alter();
    table.integer("max_players").unsigned().notNullable().alter();
  });

  await knex.raw(`
    ALTER TABLE SeasonSignupSettings
    ADD CONSTRAINT check_season_signup_player_limits
    CHECK (
      min_players >= 1
      AND max_players >= 1
      AND min_players <= max_players
    )
  `);

  await knex.schema.alterTable("GameTypes", (table) => {
    table.dropColumn("min_players");
    table.dropColumn("max_players");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("GameTypes", (table) => {
    table.integer("min_players").unsigned().nullable();
    table.integer("max_players").unsigned().nullable();
  });

  await knex.raw(`
    UPDATE GameTypes SET min_players = 5, max_players = 9 WHERE id = 1;
    UPDATE GameTypes SET min_players = 2, max_players = 3 WHERE id = 2;
    UPDATE GameTypes SET min_players = 2, max_players = 3 WHERE id = 3;
    UPDATE GameTypes SET min_players = 3, max_players = 10 WHERE id = 4;
    UPDATE GameTypes SET min_players = 3, max_players = 5 WHERE id = 5;
    UPDATE GameTypes SET min_players = 5, max_players = 7 WHERE id = 6;
  `);

  await knex.schema.dropTableIfExists("SeasonSignupSettings");
}
