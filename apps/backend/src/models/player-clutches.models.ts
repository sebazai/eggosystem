import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { type DemoClutches } from "../types/parse-queue.types";

export const upsertPlayerClutchesForGame = async ({
  matchGameId,
  clutches,
  connection
}: {
  matchGameId: number;
  clutches: DemoClutches;
  connection?: PoolConnection;
}) => {
  const infos = clutches?.Infos ?? [];
  if (infos.length === 0) {
    return;
  }

  const query = `INSERT INTO PlayerClutches (
    match_game_id,
    round_number,
    player_steam_id,
    player_team,
    won,
    clutch_start_enemies,
    kills,
    end_info
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    player_team = VALUES(player_team),
    won = VALUES(won),
    clutch_start_enemies = VALUES(clutch_start_enemies),
    kills = VALUES(kills),
    end_info = VALUES(end_info)`;

  await Promise.all(
    infos.map((clutch) =>
      runQuery(
        query,
        [
          matchGameId,
          clutch.RoundNumber,
          String(clutch.SteamID),
          clutch.PlayerTeam,
          clutch.Won ? 1 : 0,
          clutch.ClutchStartEnemies,
          clutch.Kills,
          clutch.EndInfo
        ],
        connection
      )
    )
  );
};
