import { getSeasonById } from "./season.models";
import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import type { PoolConnection } from "mysql2/promise";

describe("Season Models Integration Tests", () => {
  let connection: PoolConnection;
  const testSeasonId = 9998;

  beforeAll(async () => {
    connection = await getConnection();
  });

  afterAll(async () => {
    if (connection) {
      connection.release();
    }
  });

  beforeEach(async () => {
    // Clean up test data
    await cleanupTestData();

    // Seed test data
    await seedTestData();
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestData();
  });

  const cleanupTestData = async () => {
    try {
      await runQuery(
        "DELETE FROM SeasonActiveMapPool WHERE season_id = ?",
        [testSeasonId],
        connection
      );
    } catch (error: unknown) {
      // Table might not exist if migrations haven't been run
      if (!(error as Error).message?.includes("doesn't exist")) {
        throw error;
      }
    }
    await runQuery(
      "DELETE FROM Seasons WHERE id = ?",
      [testSeasonId],
      connection
    );
  };

  const seedTestData = async () => {
    // Seed test season with specific dates in UTC
    await runQuery(
      `INSERT INTO Seasons (
        id, game_id, game_type_id, organizer_id, name, full_name,
        signup_start_date, signup_end_date, start_date, end_date,
        platform, is_round_robin_bo2_as_2xbo1, has_vat, registration_price
      ) VALUES (?, 1, 1, 1, 'Test Season', 'Test Season Full Name',
        ?, ?, '2024-02-01', ?,
        'faceit', false, true, ?)`,
      [
        testSeasonId,
        "2024-01-01 00:00:00", // UTC datetime
        "2024-01-15 00:00:00", // UTC datetime
        "2024-12-31",
        150
      ],
      connection
    );

    // Seed active map pool (required for getSeasonById)
    try {
      await runQuery(
        `INSERT INTO SeasonActiveMapPool (season_id, map_id) VALUES (?, ?), (?, ?), (?, ?)`,
        [testSeasonId, 1, testSeasonId, 2, testSeasonId, 3],
        connection
      );
    } catch (error: unknown) {
      // Table might not exist if migrations haven't been run
      if (!(error as Error).message?.includes("doesn't exist")) {
        throw error;
      }
    }
  };

  describe("getSeasonById", () => {
    it("should return a season when found with dates in UTC timezone", async () => {
      // Verify the season was inserted
      const [insertedSeason] = await runQuery<
        Array<{ id: number } | undefined>
      >("SELECT id FROM Seasons WHERE id = ?", [testSeasonId], connection);
      expect(insertedSeason).toBeDefined();
      expect(insertedSeason?.id).toBe(testSeasonId);

      // Use real implementation to ensure it uses the real database connection
      const result = await getSeasonById(testSeasonId, connection);

      expect(result).toBeDefined();
      expect(result?.id).toBe(testSeasonId);
      expect(result?.registration_price).toBe(150);

      // Dates should be Date objects (Express res.json() will serialize them to ISO strings)
      // MySQL TIMESTAMP fields are stored in UTC and returned as Date objects when dateStrings is false
      expect(result?.signup_start_date).toBeInstanceOf(Date);
      expect(result?.signup_end_date).toBeInstanceOf(Date);

      // Verify the Date objects represent the correct UTC time
      expect((result?.signup_start_date as unknown as Date).toISOString()).toBe(
        "2024-01-01T00:00:00.000Z"
      );
      expect((result?.signup_end_date as unknown as Date).toISOString()).toBe(
        "2024-01-15T00:00:00.000Z"
      );
    });

    it("should return undefined when season not found", async () => {
      const result = await getSeasonById(99999, connection);
      expect(result).toBeUndefined();
    });
  });
});
