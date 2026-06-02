import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { replaceMatchGameRows } from "../db/replaceMatchGameRows";
import { type HitEvent } from "../types/parse-queue.types";

interface SavePlayerHitLogsParams {
  matchGameId: number;
  events: HitEvent[];
  connection: PoolConnection;
}

export const savePlayerHitLogsForGame = async ({
  matchGameId,
  events,
  connection
}: SavePlayerHitLogsParams): Promise<void> => {
  await replaceMatchGameRows(
    connection,
    matchGameId,
    "PlayerHitLogs",
    async () => {
      if (!events || events.length === 0) return;

      const values = events.map((e) => [
        matchGameId,
        e.round_number,
        e.time_in_round,
        String(e.attacker),
        e.attacker_team,
        String(e.victim),
        e.victim_team,
        e.weapon,
        e.hit_group,
        e.health_damage,
        e.armor_damage,
        e.health_remaining
      ]);

      const placeholders = values
        .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .join(", ");

      await runQuery(
        `INSERT INTO PlayerHitLogs (
        match_game_id, round_number, time_in_round,
        attacker_steam_id, attacker_team,
        victim_steam_id, victim_team,
        weapon, hit_group,
        health_damage, armor_damage, health_remaining
      ) VALUES ${placeholders}`,
        values.flat(),
        connection
      );
    }
  );
};
