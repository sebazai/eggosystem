import type { Knex } from "knex";

// Normalisation of KanaRating 3.2 event tables.
//
// Three classes of change:
//
// 1. VIRTUAL GENERATED columns — columns whose value is fully determined
//    by other columns in the same row. Converting to VIRTUAL means the DB
//    enforces correctness at zero storage cost; INSERT statements no longer
//    supply these values.
//
//    FlashEvents:      is_enemy_flash, is_teammate_flash, is_self_flash
//    RoundSwingEvents: delta
//    PlayerHitLogs:    is_kill_hit
//
//    MariaDB does not support MODIFY COLUMN to convert a regular column to
//    VIRTUAL GENERATED, so each conversion is DROP + ADD.
//
// 2. Dropped columns — RoundUtilitySummary columns that duplicate data
//    already captured in dedicated event tables:
//
//    enemies_flashed  → derivable from FlashEvents (COUNT WHERE is_enemy_flash)
//    teammates_flashed → derivable from FlashEvents (COUNT WHERE is_teammate_flash)
//    wasted_utility   → derivable from WastedUtilityEvents (COUNT per round/player)
//
// Run the db-invariants.integration.test.ts suite to confirm VIRTUAL GENERATED
// columns and PlayerKillLogs denormalization invariants hold after this migration.
export async function up(knex: Knex): Promise<void> {
  // ── FlashEvents: flash classification flags → VIRTUAL GENERATED ───────────
  await knex.raw(`ALTER TABLE FlashEvents DROP COLUMN is_enemy_flash`);
  await knex.raw(
    `ALTER TABLE FlashEvents ADD COLUMN is_enemy_flash TINYINT(1) GENERATED ALWAYS AS (thrower_team != victim_team) VIRTUAL`
  );

  await knex.raw(`ALTER TABLE FlashEvents DROP COLUMN is_self_flash`);
  await knex.raw(
    `ALTER TABLE FlashEvents ADD COLUMN is_self_flash TINYINT(1) GENERATED ALWAYS AS (thrower_steam_id = victim_steam_id) VIRTUAL`
  );

  await knex.raw(`ALTER TABLE FlashEvents DROP COLUMN is_teammate_flash`);
  await knex.raw(
    `ALTER TABLE FlashEvents ADD COLUMN is_teammate_flash TINYINT(1) GENERATED ALWAYS AS (thrower_team = victim_team AND thrower_steam_id != victim_steam_id) VIRTUAL`
  );

  // ── RoundSwingEvents: delta → VIRTUAL GENERATED ───────────────────────────
  await knex.raw(`ALTER TABLE RoundSwingEvents DROP COLUMN delta`);
  await knex.raw(
    `ALTER TABLE RoundSwingEvents ADD COLUMN delta DECIMAL(5,4) GENERATED ALWAYS AS (post_win_prob - pre_win_prob) VIRTUAL`
  );

  // ── PlayerHitLogs: is_kill_hit → VIRTUAL GENERATED ────────────────────────
  await knex.raw(`ALTER TABLE PlayerHitLogs DROP COLUMN is_kill_hit`);
  await knex.raw(
    `ALTER TABLE PlayerHitLogs ADD COLUMN is_kill_hit TINYINT(1) GENERATED ALWAYS AS (health_remaining = 0) VIRTUAL`
  );

  // ── RoundUtilitySummary: drop redundant columns ───────────────────────────
  await knex.schema.alterTable("RoundUtilitySummary", (table) => {
    table.dropColumn("enemies_flashed");
    table.dropColumn("teammates_flashed");
    table.dropColumn("wasted_utility");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Restore RoundUtilitySummary redundant columns (defaulting to 0)
  await knex.schema.alterTable("RoundUtilitySummary", (table) => {
    table.smallint("enemies_flashed").unsigned().notNullable().defaultTo(0);
    table.smallint("teammates_flashed").unsigned().notNullable().defaultTo(0);
    table.smallint("wasted_utility").unsigned().notNullable().defaultTo(0);
  });

  // Restore PlayerHitLogs.is_kill_hit as a regular boolean column
  await knex.raw(`ALTER TABLE PlayerHitLogs DROP COLUMN is_kill_hit`);
  await knex.raw(
    `ALTER TABLE PlayerHitLogs ADD COLUMN is_kill_hit TINYINT(1) NOT NULL DEFAULT 0`
  );

  // Restore RoundSwingEvents.delta as a regular decimal column
  await knex.raw(`ALTER TABLE RoundSwingEvents DROP COLUMN delta`);
  await knex.raw(
    `ALTER TABLE RoundSwingEvents ADD COLUMN delta DECIMAL(5,4) NOT NULL DEFAULT 0`
  );

  // Restore FlashEvents flash flags as regular boolean columns
  await knex.raw(`ALTER TABLE FlashEvents DROP COLUMN is_enemy_flash`);
  await knex.raw(
    `ALTER TABLE FlashEvents ADD COLUMN is_enemy_flash TINYINT(1) NOT NULL DEFAULT 0`
  );
  await knex.raw(`ALTER TABLE FlashEvents DROP COLUMN is_self_flash`);
  await knex.raw(
    `ALTER TABLE FlashEvents ADD COLUMN is_self_flash TINYINT(1) NOT NULL DEFAULT 0`
  );
  await knex.raw(`ALTER TABLE FlashEvents DROP COLUMN is_teammate_flash`);
  await knex.raw(
    `ALTER TABLE FlashEvents ADD COLUMN is_teammate_flash TINYINT(1) NOT NULL DEFAULT 0`
  );
}
