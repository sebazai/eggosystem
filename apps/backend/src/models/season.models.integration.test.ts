import {
  getSeasonById,
  getSeasonGrandFinalRoundOneOnly
} from "./season.models";
import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import type { PoolConnection } from "mysql2/promise";
import {
  deleteTestSeasonSignupSettings,
  insertTestSeasonSignupSettings
} from "../__utils__/season-signup-settings-test";
import {
  deleteTestCSSeasonSettings,
  insertTestCSSeasonSettings
} from "../__utils__/cs-season-settings-test";

describe("Season Models Integration Tests", () => {
  let connection: PoolConnection;
  const testSeasonId = 9998;
  const nonCsSeasonId = 9997;

  beforeAll(async () => {
    connection = await getConnection();
  });

  afterAll(async () => {
    if (connection) {
      connection.release();
    }
  });

  beforeEach(async () => {
    await cleanupTestData();
    await seedTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  const cleanupTestData = async () => {
    // Clean 9997 (no-CS-settings season)
    await deleteTestCSSeasonSettings(nonCsSeasonId, connection);
    await deleteTestSeasonSignupSettings(nonCsSeasonId, connection);
    await runQuery(
      "DELETE FROM Seasons WHERE id = ?",
      [nonCsSeasonId],
      connection
    );

    // Clean 9998 (primary test season)
    try {
      await runQuery(
        "DELETE FROM SeasonActiveMapPool WHERE season_id = ?",
        [testSeasonId],
        connection
      );
    } catch (error: unknown) {
      if (!(error as Error).message?.includes("doesn't exist")) {
        throw error;
      }
    }
    await deleteTestCSSeasonSettings(testSeasonId, connection);
    await deleteTestSeasonSignupSettings(testSeasonId, connection);
    await runQuery(
      "DELETE FROM Seasons WHERE id = ?",
      [testSeasonId],
      connection
    );
  };

  const seedTestData = async () => {
    await runQuery(
      `INSERT INTO Seasons (
        id, game_id, game_type_id, organizer_id, name, full_name,
        signup_start_date, signup_end_date, start_date, end_date,
        platform, has_vat, registration_price
      ) VALUES (?, 1, 1, 1, 'Test Season', 'Test Season Full Name',
        ?, ?, '2024-02-01', ?,
        'faceit', true, ?)`,
      [
        testSeasonId,
        "2024-01-01 00:00:00",
        "2024-01-15 00:00:00",
        "2024-12-31",
        150
      ],
      connection
    );

    await insertTestSeasonSignupSettings(testSeasonId, undefined, connection);
    await insertTestCSSeasonSettings(testSeasonId, undefined, connection);

    try {
      await runQuery(
        `INSERT INTO SeasonActiveMapPool (season_id, map_id) VALUES (?, ?), (?, ?), (?, ?)`,
        [testSeasonId, 1, testSeasonId, 2, testSeasonId, 3],
        connection
      );
    } catch (error: unknown) {
      if (!(error as Error).message?.includes("doesn't exist")) {
        throw error;
      }
    }
  };

  describe("getSeasonById", () => {
    it("should return a season when found with dates in UTC timezone", async () => {
      const [insertedSeason] = await runQuery<
        Array<{ id: number } | undefined>
      >("SELECT id FROM Seasons WHERE id = ?", [testSeasonId], connection);
      expect(insertedSeason).toBeDefined();
      expect(insertedSeason?.id).toBe(testSeasonId);

      const result = await getSeasonById(testSeasonId, connection);

      expect(result).toBeDefined();
      expect(result?.id).toBe(testSeasonId);
      expect(result?.registration_price).toBe(150);

      // Dates should be Date objects
      expect(result?.signup_start_date).toBeInstanceOf(Date);
      expect(result?.signup_end_date).toBeInstanceOf(Date);
      expect((result?.signup_start_date as unknown as Date).toISOString()).toBe(
        "2024-01-01T00:00:00.000Z"
      );
      expect((result?.signup_end_date as unknown as Date).toISOString()).toBe(
        "2024-01-15T00:00:00.000Z"
      );

      // Signup settings fields (from SeasonSignupSettings INNER JOIN)
      expect(result?.min_players).toBe(5);
      expect(result?.max_players).toBe(9);

      // CS settings fields (from CSSeasonSettings LEFT JOIN, using helper defaults)
      expect(result?.is_round_robin_bo2_as_2xbo1).toBe(false);
      expect(result?.grand_final_round_one_only).toBe(true);
      expect(result?.faceit_rank_required).toBe(false);
      expect(result?.premier_rank_required).toBe(false);
      expect(result?.hours_played_required).toBe(false);
    });

    it("should return signup settings as explicitly seeded", async () => {
      // Re-seed with specific non-default values to verify the values flow through
      await deleteTestSeasonSignupSettings(testSeasonId, connection);
      await insertTestSeasonSignupSettings(
        testSeasonId,
        { min_players: 2, max_players: 3 },
        connection
      );

      const result = await getSeasonById(testSeasonId, connection);

      expect(result?.min_players).toBe(2);
      expect(result?.max_players).toBe(3);
    });

    it("should return CS settings as explicitly seeded", async () => {
      await deleteTestCSSeasonSettings(testSeasonId, connection);
      await insertTestCSSeasonSettings(
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

      const result = await getSeasonById(testSeasonId, connection);

      expect(result?.is_round_robin_bo2_as_2xbo1).toBe(true);
      expect(result?.grand_final_round_one_only).toBe(false);
      expect(result?.faceit_rank_required).toBe(true);
      expect(result?.premier_rank_required).toBe(true);
      expect(result?.hours_played_required).toBe(true);
    });

    it("should return COALESCE defaults for CS fields when no CSSeasonSettings row exists", async () => {
      // Seed a season with SeasonSignupSettings but no CSSeasonSettings row
      await runQuery(
        `INSERT INTO Seasons (id, game_id, game_type_id, organizer_id, name, full_name, start_date, platform)
         VALUES (?, 1, 1, 1, 'Non-CS Season', 'Non-CS Season', '2025-01-01', 'faceit')`,
        [nonCsSeasonId],
        connection
      );
      await insertTestSeasonSignupSettings(
        nonCsSeasonId,
        undefined,
        connection
      );
      // Deliberately do NOT insert CSSeasonSettings — LEFT JOIN should return COALESCE defaults

      const result = await getSeasonById(nonCsSeasonId, connection);

      expect(result).toBeDefined();
      // COALESCE defaults from SEASON_CS_SETTINGS_SQL
      expect(result?.is_round_robin_bo2_as_2xbo1).toBe(false);
      expect(result?.grand_final_round_one_only).toBe(true);
      expect(result?.faceit_rank_required).toBe(false);
      expect(result?.premier_rank_required).toBe(false);
      expect(result?.hours_played_required).toBe(false);
    });

    it("should return undefined when season not found", async () => {
      const result = await getSeasonById(99999, connection);
      expect(result).toBeUndefined();
    });
  });

  describe("getSeasonGrandFinalRoundOneOnly", () => {
    it("returns true when the CSSeasonSettings row has grand_final_round_one_only=true", async () => {
      // Default helper inserts grand_final_round_one_only: true (matches DB DDL default)
      const result = await getSeasonGrandFinalRoundOneOnly(
        testSeasonId,
        connection
      );
      expect(result).toBe(true);
    });

    it("returns false when the CSSeasonSettings row has grand_final_round_one_only=false", async () => {
      await deleteTestCSSeasonSettings(testSeasonId, connection);
      await insertTestCSSeasonSettings(
        testSeasonId,
        { grand_final_round_one_only: false },
        connection
      );

      const result = await getSeasonGrandFinalRoundOneOnly(
        testSeasonId,
        connection
      );
      expect(result).toBe(false);
    });

    it("returns false when no CSSeasonSettings row exists for the season_id", async () => {
      await deleteTestCSSeasonSettings(testSeasonId, connection);

      const result = await getSeasonGrandFinalRoundOneOnly(
        testSeasonId,
        connection
      );
      // Boolean(undefined) === false
      expect(result).toBe(false);
    });

    it("returns false for a season_id that does not exist at all", async () => {
      const result = await getSeasonGrandFinalRoundOneOnly(99999, connection);
      expect(result).toBe(false);
    });
  });
});
