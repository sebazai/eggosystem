import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { replaceMatchGameRows } from "../db/replaceMatchGameRows";
import { type DemoClutches } from "../types/parse-queue.types";
import { keepLastByKey } from "../utils/keep-last-by-key";

export const savePlayerClutchesForGame = async ({
  matchGameId,
  clutches,
  connection
}: {
  matchGameId: number;
  clutches: DemoClutches;
  connection: PoolConnection;
}) => {
  await replaceMatchGameRows(
    connection,
    matchGameId,
    "PlayerClutches",
    async () => {
      const infos = keepLastByKey(
        clutches?.Infos ?? [],
        (clutch) => `${clutch.RoundNumber}:${clutch.SteamID}`
      );
      if (infos.length === 0) return;

      const values = infos.map((clutch) => [
        matchGameId,
        clutch.RoundNumber,
        String(clutch.SteamID),
        clutch.PlayerTeam,
        clutch.Won ? 1 : 0,
        clutch.ClutchStartEnemies,
        clutch.Kills,
        clutch.EndInfo
      ]);

      const placeholders = values
        .map(() => "(?, ?, ?, ?, ?, ?, ?, ?)")
        .join(", ");

      await runQuery(
        `INSERT INTO PlayerClutches (
        match_game_id,
        round_number,
        player_steam_id,
        player_team,
        won,
        clutch_start_enemies,
        kills,
        end_info
      ) VALUES ${placeholders}`,
        values.flat(),
        connection
      );
    }
  );
};
