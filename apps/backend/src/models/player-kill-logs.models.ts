import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { type KillEvent } from "../types/parse-queue.types";

interface UpsertPlayerKillLogsParams {
  matchGameId: number;
  killLogs: KillEvent[];
  connection: PoolConnection;
}

/**
 * The parser emits 0 for "no setup player" (uint64 zero value).
 * We store NULL in the DB so the column semantics are clean.
 */
function setupSteamIdOrNull(value: number | undefined): string | null {
  if (!value || value === 0) return null;
  return String(value);
}

/**
 * Upserts player kill logs for a match game.
 * Includes KanaRating 3.2 enrichment fields when present; absent fields are
 * stored as NULL so old parser output continues to ingest without errors.
 */
export const upsertPlayerKillLogsForGame = async ({
  matchGameId,
  killLogs,
  connection
}: UpsertPlayerKillLogsParams): Promise<void> => {
  if (!killLogs || killLogs.length === 0) {
    return;
  }

  const values = killLogs.map((kill) => [
    matchGameId,
    kill.round_number,
    kill.time_in_round,
    String(kill.killer),
    kill.killer_team,
    String(kill.victim),
    kill.victim_team,
    kill.weapon,
    kill.is_headshot ? 1 : 0,
    kill.is_penetration ? 1 : 0,
    kill.is_first_kill ? 1 : 0,
    kill.cts_alive_after,
    kill.ts_alive_after,
    kill.bomb_planted ? 1 : 0,
    kill.assister ? String(kill.assister) : null,
    kill.is_flash_assist ? 1 : 0,
    // KanaRating 3.2 enrichment — null when field is absent (old parser)
    kill.is_first_death ?? null,
    kill.is_exit_kill ?? null,
    kill.is_post_plant ?? null,
    kill.was_victim_traded ?? null,
    kill.ct_buy_type ?? null,
    kill.t_buy_type ?? null,
    setupSteamIdOrNull(kill.setup_flash_thrower),
    setupSteamIdOrNull(kill.setup_damage_player),
    kill.victim_blind_seconds ?? null
  ]);

  const placeholders = values
    .map(
      () =>
        "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .join(", ");

  const query = `
    INSERT INTO PlayerKillLogs (
      match_game_id,
      round_number,
      time_in_round,
      killer,
      killer_team,
      victim,
      victim_team,
      weapon,
      is_headshot,
      is_penetration,
      is_first_kill,
      cts_alive_after,
      ts_alive_after,
      bomb_planted,
      assister,
      is_flash_assist,
      is_first_death,
      is_exit_kill,
      is_post_plant,
      was_victim_traded,
      ct_buy_type,
      t_buy_type,
      setup_flash_thrower,
      setup_damage_player,
      victim_blind_seconds
    ) VALUES ${placeholders}
    ON DUPLICATE KEY UPDATE
      weapon = VALUES(weapon),
      is_headshot = VALUES(is_headshot),
      is_penetration = VALUES(is_penetration),
      is_first_kill = VALUES(is_first_kill),
      cts_alive_after = VALUES(cts_alive_after),
      ts_alive_after = VALUES(ts_alive_after),
      bomb_planted = VALUES(bomb_planted),
      assister = VALUES(assister),
      is_flash_assist = VALUES(is_flash_assist),
      is_first_death = VALUES(is_first_death),
      is_exit_kill = VALUES(is_exit_kill),
      is_post_plant = VALUES(is_post_plant),
      was_victim_traded = VALUES(was_victim_traded),
      ct_buy_type = VALUES(ct_buy_type),
      t_buy_type = VALUES(t_buy_type),
      setup_flash_thrower = VALUES(setup_flash_thrower),
      setup_damage_player = VALUES(setup_damage_player),
      victim_blind_seconds = VALUES(victim_blind_seconds)
  `;

  await runQuery(query, values.flat(), connection);
};
