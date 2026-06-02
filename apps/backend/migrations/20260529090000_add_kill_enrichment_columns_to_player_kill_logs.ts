import type { Knex } from "knex";

// KanaRating 3.2: enrich PlayerKillLogs with contextual tags exported by the parser.
// All columns are nullable so existing rows (old parser output) stay valid with NULL.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("PlayerKillLogs", (table) => {
    table
      .boolean("is_first_death")
      .nullable()
      .comment("Victim was the first to die this round");
    table
      .boolean("is_exit_kill")
      .nullable()
      .comment(
        "Killer's team has 1 alive vs 4+ enemies, bomb not planted, >10s left"
      );
    table
      .boolean("is_post_plant")
      .nullable()
      .comment("Bomb was planted at the time of this kill");
    table
      .boolean("was_victim_traded")
      .nullable()
      .comment("Victim's death was subsequently traded");
    table
      .string("ct_buy_type", 32)
      .nullable()
      .comment("CT team buy type this round, denormalised from MapRoundStats");
    table
      .string("t_buy_type", 32)
      .nullable()
      .comment("T team buy type this round, denormalised from MapRoundStats");
    table
      .bigInteger("setup_flash_thrower")
      .nullable()
      .comment(
        "Steam ID of the player whose flash enabled this kill; NULL if none"
      );
    table
      .bigInteger("setup_damage_player")
      .nullable()
      .comment(
        "Steam ID of the player whose utility damage set up this kill; NULL if none"
      );
    table
      .decimal("victim_blind_seconds", 6, 3)
      .nullable()
      .comment("Seconds the victim was blinded at the time of the kill");

    // Partial indexes useful for the most common filtered queries
    table.index(["match_game_id", "is_first_death"]);
    table.index(["match_game_id", "is_exit_kill"]);
    table.index(["match_game_id", "is_post_plant"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("PlayerKillLogs", (table) => {
    table.dropIndex(["match_game_id", "is_first_death"]);
    table.dropIndex(["match_game_id", "is_exit_kill"]);
    table.dropIndex(["match_game_id", "is_post_plant"]);
    table.dropColumn("is_first_death");
    table.dropColumn("is_exit_kill");
    table.dropColumn("is_post_plant");
    table.dropColumn("was_victim_traded");
    table.dropColumn("ct_buy_type");
    table.dropColumn("t_buy_type");
    table.dropColumn("setup_flash_thrower");
    table.dropColumn("setup_damage_player");
    table.dropColumn("victim_blind_seconds");
  });
}
