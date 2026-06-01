import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { replaceMatchGameRows } from "../db/replaceMatchGameRows";
import { type KillEvent } from "../types/parse-queue.types";

interface SavePlayerKillLogsParams {
  matchGameId: number;
  killLogs: KillEvent[];
  connection: PoolConnection;
}

function setupSteamIdOrNull(value: number | undefined): string | null {
  if (!value || value === 0) return null;
  return String(value);
}

export const savePlayerKillLogsForGame = async ({
  matchGameId,
  killLogs,
  connection
}: SavePlayerKillLogsParams): Promise<void> => {
  await replaceMatchGameRows(
    connection,
    matchGameId,
    "PlayerKillLogs",
    async () => {
      if (!killLogs || killLogs.length === 0) return;

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

      await runQuery(
        `INSERT INTO PlayerKillLogs (
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
      ) VALUES ${placeholders}`,
        values.flat(),
        connection
      );
    }
  );
};
