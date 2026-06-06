import { upsertCSSeasonSettings } from "./cs-season-settings.models";
import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import {
  insertTestSeasonSignupSettings,
  deleteTestSeasonSignupSettings
} from "../__utils__/season-signup-settings-test";
import type { PoolConnection } from "mysql2/promise";

interface CSSettingsRow {
  season_id: number;
  is_round_robin_bo2_as_2xbo1: number;
  grand_final_round_one_only: number;
  faceit_rank_required: number;
  premier_rank_required: number;
  hours_played_required: number;
}

describe("upsertCSSeasonSettings integration tests", () => {
  let connection: PoolConnection;
  const testSeasonId = 9994;

  const readRow = async (): Promise<CSSettingsRow | undefined> => {
    const [row] = await runQuery<Array<CSSettingsRow | undefined>>(
      `SELECT season_id, is_round_robin_bo2_as_2xbo1, grand_final_round_one_only,
              faceit_rank_required, premier_rank_required, hours_played_required
       FROM CSSeasonSettings WHERE season_id = ?`,
      [testSeasonId],
      connection
    );
    return row;
  };

  beforeAll(async () => {
    connection = await getConnection();
    await runQuery(
      `INSERT INTO Seasons (id, game_id, game_type_id, organizer_id, name, full_name, start_date, platform)
       VALUES (?, 1, 1, 1, 'CS Settings Test 9994', 'CS Settings Test 9994', '2025-01-01', 'faceit')`,
      [testSeasonId],
      connection
    );
    await insertTestSeasonSignupSettings(testSeasonId, undefined, connection);
  });

  afterAll(async () => {
    await runQuery(
      "DELETE FROM CSSeasonSettings WHERE season_id = ?",
      [testSeasonId],
      connection
    );
    await deleteTestSeasonSignupSettings(testSeasonId, connection);
    await runQuery(
      "DELETE FROM Seasons WHERE id = ?",
      [testSeasonId],
      connection
    );
    connection.release();
  });

  afterEach(async () => {
    await runQuery(
      "DELETE FROM CSSeasonSettings WHERE season_id = ?",
      [testSeasonId],
      connection
    );
  });

  it("inserts a new row with the exact values provided", async () => {
    await upsertCSSeasonSettings(
      testSeasonId,
      {
        is_round_robin_bo2_as_2xbo1: true,
        grand_final_round_one_only: false,
        faceit_rank_required: true,
        premier_rank_required: false,
        hours_played_required: true
      },
      connection
    );

    const row = await readRow();
    expect(row).toBeDefined();
    expect(Boolean(row?.is_round_robin_bo2_as_2xbo1)).toBe(true);
    expect(Boolean(row?.grand_final_round_one_only)).toBe(false);
    expect(Boolean(row?.faceit_rank_required)).toBe(true);
    expect(Boolean(row?.premier_rank_required)).toBe(false);
    expect(Boolean(row?.hours_played_required)).toBe(true);
  });

  it("updates all fields on duplicate season_id (ON DUPLICATE KEY UPDATE)", async () => {
    await upsertCSSeasonSettings(
      testSeasonId,
      {
        is_round_robin_bo2_as_2xbo1: false,
        grand_final_round_one_only: true,
        faceit_rank_required: false,
        premier_rank_required: false,
        hours_played_required: false
      },
      connection
    );

    await upsertCSSeasonSettings(
      testSeasonId,
      {
        is_round_robin_bo2_as_2xbo1: true,
        grand_final_round_one_only: false,
        faceit_rank_required: true,
        premier_rank_required: true,
        hours_played_required: true
      },
      connection
    );

    const [count] = await runQuery<Array<{ n: number }>>(
      "SELECT COUNT(*) AS n FROM CSSeasonSettings WHERE season_id = ?",
      [testSeasonId],
      connection
    );
    expect(count.n).toBe(1);

    const row = await readRow();
    expect(Boolean(row?.is_round_robin_bo2_as_2xbo1)).toBe(true);
    expect(Boolean(row?.grand_final_round_one_only)).toBe(false);
    expect(Boolean(row?.faceit_rank_required)).toBe(true);
    expect(Boolean(row?.premier_rank_required)).toBe(true);
    expect(Boolean(row?.hours_played_required)).toBe(true);
  });

  it("stores grand_final_round_one_only=true correctly", async () => {
    await upsertCSSeasonSettings(
      testSeasonId,
      {
        is_round_robin_bo2_as_2xbo1: false,
        grand_final_round_one_only: true,
        faceit_rank_required: false,
        premier_rank_required: false,
        hours_played_required: false
      },
      connection
    );

    const row = await readRow();
    expect(Boolean(row?.grand_final_round_one_only)).toBe(true);
  });

  it("works without an explicit connection (uses pool)", async () => {
    await upsertCSSeasonSettings(testSeasonId, {
      is_round_robin_bo2_as_2xbo1: false,
      grand_final_round_one_only: true,
      faceit_rank_required: false,
      premier_rank_required: false,
      hours_played_required: false
    });

    const row = await readRow();
    expect(row?.season_id).toBe(testSeasonId);
  });
});
