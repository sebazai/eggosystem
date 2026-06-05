import { upsertSeasonSignupSettings } from "./season-signup-settings.models";
import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import type { PoolConnection } from "mysql2/promise";

interface SignupSettingsRow {
  season_id: number;
  min_players: number;
  max_players: number;
}

describe("upsertSeasonSignupSettings integration tests", () => {
  let connection: PoolConnection;
  const testSeasonId = 9993;

  const readRow = async (): Promise<SignupSettingsRow | undefined> => {
    const [row] = await runQuery<Array<SignupSettingsRow | undefined>>(
      "SELECT season_id, min_players, max_players FROM SeasonSignupSettings WHERE season_id = ?",
      [testSeasonId],
      connection
    );
    return row;
  };

  beforeAll(async () => {
    connection = await getConnection();
    await runQuery(
      `INSERT INTO Seasons (id, game_id, game_type_id, organizer_id, name, full_name, start_date, platform)
       VALUES (?, 1, 1, 1, 'Signup Settings Test 9993', 'Signup Settings Test 9993', '2025-01-01', 'faceit')`,
      [testSeasonId],
      connection
    );
  });

  afterAll(async () => {
    await runQuery(
      "DELETE FROM SeasonSignupSettings WHERE season_id = ?",
      [testSeasonId],
      connection
    );
    await runQuery(
      "DELETE FROM Seasons WHERE id = ?",
      [testSeasonId],
      connection
    );
    connection.release();
  });

  afterEach(async () => {
    await runQuery(
      "DELETE FROM SeasonSignupSettings WHERE season_id = ?",
      [testSeasonId],
      connection
    );
  });

  it("inserts a new row with the exact values provided", async () => {
    await upsertSeasonSignupSettings(
      testSeasonId,
      { min_players: 3, max_players: 7 },
      connection
    );

    const row = await readRow();
    expect(row).toBeDefined();
    expect(row?.min_players).toBe(3);
    expect(row?.max_players).toBe(7);
  });

  it("updates min_players and max_players on duplicate season_id (ON DUPLICATE KEY UPDATE)", async () => {
    await upsertSeasonSignupSettings(
      testSeasonId,
      { min_players: 5, max_players: 9 },
      connection
    );

    await upsertSeasonSignupSettings(
      testSeasonId,
      { min_players: 2, max_players: 3 },
      connection
    );

    const [count] = await runQuery<Array<{ n: number }>>(
      "SELECT COUNT(*) AS n FROM SeasonSignupSettings WHERE season_id = ?",
      [testSeasonId],
      connection
    );
    expect(count.n).toBe(1);

    const row = await readRow();
    expect(row?.min_players).toBe(2);
    expect(row?.max_players).toBe(3);
  });

  it("stores min_players equal to max_players", async () => {
    await upsertSeasonSignupSettings(
      testSeasonId,
      { min_players: 5, max_players: 5 },
      connection
    );

    const row = await readRow();
    expect(row?.min_players).toBe(5);
    expect(row?.max_players).toBe(5);
  });

  it("works without an explicit connection (uses pool)", async () => {
    await upsertSeasonSignupSettings(testSeasonId, {
      min_players: 5,
      max_players: 9
    });

    const row = await readRow();
    expect(row?.season_id).toBe(testSeasonId);
    expect(row?.min_players).toBe(5);
    expect(row?.max_players).toBe(9);
  });
});
