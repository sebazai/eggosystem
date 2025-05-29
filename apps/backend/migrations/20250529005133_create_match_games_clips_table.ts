import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("MatchGameClips", (table) => {
    table.increments("id").primary();
    table
      .integer("game_id")
      .unsigned()
      .notNullable()
      .references("MatchGames.id")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table
      .bigInteger("clip_steam_id")
      .nullable()
      .references("SteamPlayers.steam_id")
      .onDelete("SET NULL")
      .onUpdate("CASCADE");
    table.string("clip_status").notNullable();
    table.string("clip_type").notNullable();
    table.string("clip_id").nullable();
    table.string("clip_request_id").nullable();
    table.string("clip_url").nullable();
    table.string("clip_thumbnail_url").nullable();
    table.string("clip_snapshot_url").nullable();
    table.string("clip_title").nullable();
    table.string("clip_length").nullable();
    table.json("additional_data").nullable();
    table.unique(["game_id", "clip_type"], {
      indexName: "match_game_clips_game_id_clip_type_unique"
    });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("MatchGameClips");
}
