import type { SeasonSignupSettingsInput } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import type { PoolConnection } from "mysql2/promise";

export const upsertSeasonSignupSettings = async (
  seasonId: number,
  settings: SeasonSignupSettingsInput,
  connection?: PoolConnection
): Promise<void> => {
  await runQuery(
    `
    INSERT INTO SeasonSignupSettings (season_id, min_players, max_players)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      min_players = VALUES(min_players),
      max_players = VALUES(max_players)
    `,
    [seasonId, settings.min_players, settings.max_players],
    connection
  );
};
