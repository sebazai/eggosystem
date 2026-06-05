import {
  getActiveMapPoolBySeasonId,
  setActiveMapPoolForSeason
} from "./season-active-map-pool.models";
import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import type { PoolConnection } from "mysql2/promise";

describe("Season Active Map Pool Integration Tests", () => {
  let connection: PoolConnection;
  const testSeasonId = 9999;
  const testMapIds = [1, 2, 3];

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
    // Insert test season
    await runQuery(
      `INSERT INTO Seasons (id, game_id, game_type_id, organizer_id, name, full_name, start_date, end_date, platform, has_vat)
       VALUES (?, 1, 1, 1, 'Test Season', 'Test Season Full Name', '2024-01-01', '2024-12-31', 'faceit', true)`,
      [testSeasonId],
      connection
    );
  };

  describe("getActiveMapPoolBySeasonId", () => {
    it("should return empty array when season has no maps", async () => {
      const result = await getActiveMapPoolBySeasonId(testSeasonId);
      expect(result).toEqual([]);
    });

    it("should return map IDs for a season", async () => {
      // Insert test maps
      await runQuery(
        `INSERT INTO SeasonActiveMapPool (season_id, map_id) VALUES (?, ?), (?, ?), (?, ?)`,
        [testSeasonId, 1, testSeasonId, 2, testSeasonId, 3],
        connection
      );

      const result = await getActiveMapPoolBySeasonId(testSeasonId);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should return maps in ascending order", async () => {
      // Insert maps in non-ascending order
      await runQuery(
        `INSERT INTO SeasonActiveMapPool (season_id, map_id) VALUES (?, ?), (?, ?), (?, ?)`,
        [testSeasonId, 3, testSeasonId, 1, testSeasonId, 2],
        connection
      );

      const result = await getActiveMapPoolBySeasonId(testSeasonId);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe("setActiveMapPoolForSeason", () => {
    it("should insert maps correctly", async () => {
      await setActiveMapPoolForSeason(testSeasonId, testMapIds, connection);

      const result = await getActiveMapPoolBySeasonId(testSeasonId);
      expect(result).toEqual(testMapIds);
    });

    it("should delete old entries before inserting new ones", async () => {
      // First set some maps
      await setActiveMapPoolForSeason(testSeasonId, [1, 2], connection);
      let result = await getActiveMapPoolBySeasonId(testSeasonId);
      expect(result).toEqual([1, 2]);

      // Update to different maps
      await setActiveMapPoolForSeason(testSeasonId, [3, 4, 5], connection);
      result = await getActiveMapPoolBySeasonId(testSeasonId);
      expect(result).toEqual([3, 4, 5]);
      expect(result).not.toContain(1);
      expect(result).not.toContain(2);
    });

    it("should throw error on empty array", async () => {
      await expect(
        setActiveMapPoolForSeason(testSeasonId, [], connection)
      ).rejects.toThrow("Active map pool must contain at least one map");
    });

    it("should handle transaction rollback on error", async () => {
      // Try to insert with invalid map_id (should fail foreign key constraint)
      await expect(
        setActiveMapPoolForSeason(testSeasonId, [99999], connection)
      ).rejects.toThrow();

      // Verify nothing was inserted
      const result = await getActiveMapPoolBySeasonId(testSeasonId);
      expect(result).toEqual([]);
    });
  });

  describe("foreign key constraints", () => {
    it("should cascade delete when season is deleted", async () => {
      // Insert maps
      await setActiveMapPoolForSeason(testSeasonId, testMapIds, connection);

      // Delete season
      await runQuery(
        "DELETE FROM Seasons WHERE id = ?",
        [testSeasonId],
        connection
      );

      // Verify maps are also deleted (cascade)
      const result = await runQuery<Array<{ count: number }>>(
        "SELECT COUNT(*) as count FROM SeasonActiveMapPool WHERE season_id = ?",
        [testSeasonId],
        connection
      );
      expect(result[0]!.count).toBe(0);
    });

    it("should prevent deleting map that is in active pool", async () => {
      // Insert maps
      await setActiveMapPoolForSeason(testSeasonId, [1], connection);

      // Try to delete map (should fail with RESTRICT)
      await expect(
        runQuery("DELETE FROM Maps WHERE id = ?", [1], connection)
      ).rejects.toThrow();
    });
  });
});
