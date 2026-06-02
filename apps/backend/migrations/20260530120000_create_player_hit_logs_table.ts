import type { Knex } from "knex";

// One row per PlayerHurt damage event. Powers per-hit accuracy analysis,
// hit-group breakdowns, ADR drill-downs, and coaching views.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("PlayerHitLogs", (table) => {
    table.bigIncrements("id").primary();
    table
      .integer("match_game_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("MatchGames")
      .onDelete("CASCADE");
    table.tinyint("round_number").unsigned().notNullable();
    table
      .decimal("time_in_round", 7, 3)
      .notNullable()
      .comment("Seconds since round start");
    table
      .bigInteger("attacker_steam_id")
      .notNullable()
      .comment("Attacker SteamID64; equals victim for self-damage");
    table.string("attacker_team", 2).notNullable().comment("CT or T");
    table
      .bigInteger("victim_steam_id")
      .notNullable()
      .comment("Victim SteamID64");
    table.string("victim_team", 2).notNullable().comment("CT or T");
    table.string("weapon", 64).notNullable();
    table
      .string("hit_group", 16)
      .notNullable()
      .comment(
        "head | chest | stomach | left_arm | right_arm | left_leg | right_leg | neck | gear | generic"
      );
    table
      .smallint("health_damage")
      .unsigned()
      .notNullable()
      .comment("HP damage taken (capped — no over-damage)");
    table
      .smallint("armor_damage")
      .unsigned()
      .notNullable()
      .comment("Armor damage taken (capped)");
    table
      .smallint("health_remaining")
      .unsigned()
      .notNullable()
      .comment("Victim HP after hit; 0 on kill");
    table
      .boolean("is_kill_hit")
      .notNullable()
      .defaultTo(false)
      .comment("True for the shot that killed the victim");
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.index(["match_game_id"]);
    table.index(["match_game_id", "round_number"]);
    table.index(["attacker_steam_id"]);
    table.index(["victim_steam_id"]);
    // Hit-group kill analysis (headshot/kill breakdowns)
    table.index(["match_game_id", "hit_group", "is_kill_hit"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("PlayerHitLogs");
}
