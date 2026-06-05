import type { CSSeasonSettingsInput } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import type { PoolConnection } from "mysql2/promise";

export const upsertCSSeasonSettings = async (
  seasonId: number,
  settings: CSSeasonSettingsInput,
  connection?: PoolConnection
): Promise<void> => {
  await runQuery(
    `
    INSERT INTO CSSeasonSettings (
      season_id,
      is_round_robin_bo2_as_2xbo1,
      faceit_rank_required,
      premier_rank_required,
      hours_played_required
    ) VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      is_round_robin_bo2_as_2xbo1 = VALUES(is_round_robin_bo2_as_2xbo1),
      faceit_rank_required        = VALUES(faceit_rank_required),
      premier_rank_required       = VALUES(premier_rank_required),
      hours_played_required       = VALUES(hours_played_required)
    `,
    [
      seasonId,
      settings.is_round_robin_bo2_as_2xbo1,
      settings.faceit_rank_required,
      settings.premier_rank_required,
      settings.hours_played_required
    ],
    connection
  );
};
