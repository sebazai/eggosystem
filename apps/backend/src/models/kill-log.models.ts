import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { type KillEvent } from "../types/parse-queue.types";

interface UpsertKillLogsParams {
  matchGameId: number;
  killLogs: KillEvent[];
  connection: PoolConnection;
}

/**
 * Upserts kill logs for a match game
 * Uses INSERT ... ON DUPLICATE KEY UPDATE to handle re-parsing
 */
export const upsertKillLogsForGame = async ({
  matchGameId,
  killLogs,
  connection
}: UpsertKillLogsParams): Promise<void> => {
  if (!killLogs || killLogs.length === 0) {
    return;
  }

  // Build bulk insert query
  const values = killLogs.map((kill) => [
    matchGameId,
    kill.round_number,
    kill.time_in_round,
    String(kill.killer), // Convert to string for bigint storage
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
    kill.is_flash_assist ? 1 : 0
  ]);

  const placeholders = values
    .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .join(", ");

  const query = `
    INSERT INTO KillLogs (
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
      is_flash_assist
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
      is_flash_assist = VALUES(is_flash_assist)
  `;

  const flatValues = values.flat();
  await runQuery(query, flatValues, connection);
};

/**
 * Get kill logs for a match game
 */
export interface KillLog {
  id: number;
  match_game_id: number;
  round_number: number;
  time_in_round: number;
  killer: string; // bigint as string
  killer_team: "CT" | "T";
  victim: string;
  victim_team: "CT" | "T";
  weapon: string;
  is_headshot: boolean;
  is_penetration: boolean;
  is_first_kill: boolean;
  cts_alive_after: number;
  ts_alive_after: number;
  bomb_planted: boolean;
  assister: string | null;
  is_flash_assist: boolean;
}

export const getKillLogsForGame = async (
  matchGameId: number
): Promise<KillLog[]> => {
  const query = `
    SELECT 
      id,
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
      is_flash_assist
    FROM KillLogs
    WHERE match_game_id = ?
    ORDER BY round_number, time_in_round
  `;

  return runQuery<KillLog[]>(query, [matchGameId]);
};

/**
 * Get kill logs for a specific round
 */
export const getKillLogsForRound = async (
  matchGameId: number,
  roundNumber: number
): Promise<KillLog[]> => {
  const query = `
    SELECT 
      id,
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
      is_flash_assist
    FROM KillLogs
    WHERE match_game_id = ? AND round_number = ?
    ORDER BY time_in_round
  `;

  return runQuery<KillLog[]>(query, [matchGameId, roundNumber]);
};
