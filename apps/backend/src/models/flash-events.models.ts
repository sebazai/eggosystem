import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { type FlashEvent } from "../types/parse-queue.types";

// ── Flash query types ─────────────────────────────────────────────────────────

export interface FlashMatrixEntry {
  thrower_steam_id: string;
  victim_steam_id: string;
  flash_count: number;
  avg_duration_seconds: number;
  total_duration_seconds: number;
}

export interface PlayerFlashStats {
  steam_id: string;
  enemy_flashes: number;
  teammate_flashes: number;
  self_flashes: number;
  total_flashes: number;
  avg_duration_seconds: number;
  total_duration_seconds: number;
}

interface SaveFlashEventsParams {
  matchGameId: number;
  events: FlashEvent[];
  connection: PoolConnection;
}

/**
 * Replaces all flash events for a match game.
 * Delete-then-insert inside the caller's transaction ensures idempotent reparse.
 */
export const saveFlashEventsForGame = async ({
  matchGameId,
  events,
  connection
}: SaveFlashEventsParams): Promise<void> => {
  await runQuery(
    "DELETE FROM FlashEvents WHERE match_game_id = ?",
    [matchGameId],
    connection
  );

  if (!events || events.length === 0) return;

  const values = events.map((e) => [
    matchGameId,
    e.round_number,
    e.time_in_round,
    String(e.thrower),
    e.thrower_team,
    String(e.victim),
    e.victim_team,
    e.duration_seconds,
    e.is_enemy_flash ? 1 : 0,
    e.is_teammate_flash ? 1 : 0,
    e.is_self_flash ? 1 : 0
  ]);

  const placeholders = values
    .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .join(", ");

  await runQuery(
    `INSERT INTO FlashEvents (
      match_game_id, round_number, time_in_round,
      thrower_steam_id, thrower_team, victim_steam_id, victim_team,
      duration_seconds, is_enemy_flash, is_teammate_flash, is_self_flash
    ) VALUES ${placeholders}`,
    values.flat(),
    connection
  );
};

/**
 * Returns a flash matrix for a match game — one row per (thrower, victim) pair
 * with aggregate flash count and blind duration. Excludes zero-victim rows
 * (victim_steam_id = 0) and optionally filters to enemy flashes only.
 */
export const getFlashMatrix = async (
  matchGameId: number,
  { enemyOnly = true }: { enemyOnly?: boolean } = {}
): Promise<FlashMatrixEntry[]> => {
  const enemyFilter = enemyOnly ? "AND is_enemy_flash = 1" : "";
  const query = `
    SELECT
      thrower_steam_id,
      victim_steam_id,
      COUNT(*)                       AS flash_count,
      AVG(duration_seconds)          AS avg_duration_seconds,
      SUM(duration_seconds)          AS total_duration_seconds
    FROM FlashEvents
    WHERE match_game_id = ?
      AND victim_steam_id != 0
      ${enemyFilter}
    GROUP BY thrower_steam_id, victim_steam_id
    ORDER BY flash_count DESC, thrower_steam_id ASC
  `;

  const rows = await runQuery<
    Array<{
      thrower_steam_id: string;
      victim_steam_id: string;
      flash_count: string | number;
      avg_duration_seconds: string | number;
      total_duration_seconds: string | number;
    }>
  >(query, [matchGameId]);

  return rows.map((r) => ({
    thrower_steam_id: String(r.thrower_steam_id),
    victim_steam_id: String(r.victim_steam_id),
    flash_count: Number(r.flash_count),
    avg_duration_seconds: Number(Number(r.avg_duration_seconds).toFixed(3)),
    total_duration_seconds: Number(Number(r.total_duration_seconds).toFixed(3))
  }));
};

/**
 * Returns per-player flash stats for a match game — enemy/teammate/self flash
 * counts and blind durations for each thrower.
 */
export const getPlayerFlashStats = async (
  matchGameId: number
): Promise<PlayerFlashStats[]> => {
  const query = `
    SELECT
      thrower_steam_id                               AS steam_id,
      SUM(is_enemy_flash)                            AS enemy_flashes,
      SUM(is_teammate_flash)                         AS teammate_flashes,
      SUM(is_self_flash)                             AS self_flashes,
      COUNT(CASE WHEN victim_steam_id != 0 THEN 1 END) AS total_flashes,
      AVG(CASE WHEN victim_steam_id != 0 THEN duration_seconds END) AS avg_duration_seconds,
      SUM(CASE WHEN victim_steam_id != 0 THEN duration_seconds ELSE 0 END) AS total_duration_seconds
    FROM FlashEvents
    WHERE match_game_id = ?
    GROUP BY thrower_steam_id
    ORDER BY enemy_flashes DESC
  `;

  const rows = await runQuery<
    Array<{
      steam_id: string;
      enemy_flashes: string | number;
      teammate_flashes: string | number;
      self_flashes: string | number;
      total_flashes: string | number;
      avg_duration_seconds: string | number | null;
      total_duration_seconds: string | number;
    }>
  >(query, [matchGameId]);

  return rows.map((r) => ({
    steam_id: String(r.steam_id),
    enemy_flashes: Number(r.enemy_flashes),
    teammate_flashes: Number(r.teammate_flashes),
    self_flashes: Number(r.self_flashes),
    total_flashes: Number(r.total_flashes),
    avg_duration_seconds:
      r.avg_duration_seconds !== null
        ? Number(Number(r.avg_duration_seconds).toFixed(3))
        : 0,
    total_duration_seconds: Number(Number(r.total_duration_seconds).toFixed(3))
  }));
};
