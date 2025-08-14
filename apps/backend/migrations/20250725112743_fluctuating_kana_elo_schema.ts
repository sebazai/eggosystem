import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create new table called SteamPlayerKanaElo
  await knex.schema.createTable("SteamPlayerKanaElo", (table) => {
    table.increments("id").primary();
    table.integer("kana_elo").notNullable();
    // FK to SteamPlayers
    table
      .bigInteger("steam_id")
      .unique()
      .references("steam_id")
      .inTable("SteamPlayers")
      .notNullable();
  });
  // Get latest kana_elo for each steam_id from SeasonPlayerRanks
  const latestSeasonIds = await knex.raw(`
    SELECT DISTINCT spr1.steam_id, spr1.kana_elo
    FROM SeasonPlayerRanks spr1
    INNER JOIN (
      SELECT steam_id, MAX(season_id) as max_season_id
      FROM SeasonPlayerRanks
      WHERE kana_elo IS NOT NULL
      GROUP BY steam_id
    ) spr2 ON spr1.steam_id = spr2.steam_id AND spr1.season_id = spr2.max_season_id
    WHERE spr1.kana_elo IS NOT NULL
  `);

  // Insert into SteamPlayerKanaElo
  await knex("SteamPlayerKanaElo").insert(latestSeasonIds[0]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("SteamPlayerKanaElo");
}
