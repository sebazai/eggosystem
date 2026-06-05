import { runQuery } from "../db/mysqlRunQuery";
import type { PoolConnection } from "mysql2/promise";

const DEFAULT_TEST_CS_SEASON_SETTINGS = {
  is_round_robin_bo2_as_2xbo1: false,
  grand_final_round_one_only: false,
  faceit_rank_required: false,
  premier_rank_required: false,
  hours_played_required: false
} as const;

export async function insertTestCSSeasonSettings(
  seasonId: number,
  settings: Partial<{
    is_round_robin_bo2_as_2xbo1: boolean;
    grand_final_round_one_only: boolean;
    faceit_rank_required: boolean;
    premier_rank_required: boolean;
    hours_played_required: boolean;
  }> = {},
  connection?: PoolConnection
): Promise<void> {
  const merged = { ...DEFAULT_TEST_CS_SEASON_SETTINGS, ...settings };
  await runQuery(
    `INSERT IGNORE INTO CSSeasonSettings (
      season_id,
      is_round_robin_bo2_as_2xbo1,
      grand_final_round_one_only,
      faceit_rank_required,
      premier_rank_required,
      hours_played_required
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      seasonId,
      merged.is_round_robin_bo2_as_2xbo1,
      merged.grand_final_round_one_only,
      merged.faceit_rank_required,
      merged.premier_rank_required,
      merged.hours_played_required
    ],
    connection
  );
}

export async function deleteTestCSSeasonSettings(
  seasonId: number,
  connection?: PoolConnection
): Promise<void> {
  await runQuery(
    "DELETE FROM CSSeasonSettings WHERE season_id = ?",
    [seasonId],
    connection
  );
}
