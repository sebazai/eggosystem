import request from "supertest";
import express from "express";
import { runQuery } from "../../db/mysqlRunQuery";
import { getConnection } from "../../db/mysqlConnection";
import type { PoolConnection } from "mysql2/promise";
import { expressErrorHandler } from "../../middlewares/express-error-handler";
import seasonRouter from "../../routes/v1/dashboard/season.routes";
import { generateTestJWT } from "../../utils/auth-test-utils";

// Mock the auth middleware
jest.mock("../../middlewares/auth.middleware", () => ({
  checkPermissions: jest.fn(
    () => (req: unknown, res: unknown, next: express.NextFunction) => next()
  )
}));

describe("Season Controllers Integration Tests - Active Map Pool", () => {
  let app: express.Application;
  let connection: PoolConnection;
  const testSeasonId = 9998;

  beforeAll(async () => {
    connection = await getConnection();

    app = express();
    app.use(express.json());
    app.use("/api/v1/dashboard/seasons", seasonRouter);
    app.use(expressErrorHandler);
  });

  afterAll(async () => {
    if (connection) {
      connection.release();
    }
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  const cleanupTestData = async () => {
    await runQuery(
      "DELETE FROM SeasonActiveMapPool WHERE season_id = ?",
      [testSeasonId],
      connection
    );
    await runQuery(
      "DELETE FROM Seasons WHERE id = ?",
      [testSeasonId],
      connection
    );
  };

  describe("POST /api/v1/dashboard/seasons", () => {
    it("should create a season with active_map_pool", async () => {
      const adminJWT = generateTestJWT();
      const seasonData = {
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Test Season",
        full_name: "Test Season Full Name",
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        platform: "faceit",
        is_round_robin_bo2_as_2xbo1: false,
        has_vat: true,
        active_map_pool: [1, 2, 3]
      };

      const response = await request(app)
        .post("/api/v1/dashboard/seasons")
        .set("Authorization", `Bearer ${adminJWT}`)
        .send(seasonData)
        .expect(201);

      expect(response.body).toHaveProperty("seasonId");
      const createdSeasonId = response.body.seasonId;

      // Verify active_map_pool was saved
      const mapPool = await runQuery<Array<{ map_id: number }>>(
        "SELECT map_id FROM SeasonActiveMapPool WHERE season_id = ? ORDER BY map_id ASC",
        [createdSeasonId],
        connection
      );
      expect(mapPool.map((row) => row.map_id)).toEqual([1, 2, 3]);

      // Clean up
      await runQuery(
        "DELETE FROM SeasonActiveMapPool WHERE season_id = ?",
        [createdSeasonId],
        connection
      );
      await runQuery(
        "DELETE FROM Seasons WHERE id = ?",
        [createdSeasonId],
        connection
      );
    });

    it("should reject empty active_map_pool array", async () => {
      const adminJWT = generateTestJWT();
      const seasonData = {
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Test Season",
        full_name: "Test Season Full Name",
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        platform: "faceit",
        is_round_robin_bo2_as_2xbo1: false,
        has_vat: true,
        active_map_pool: []
      };

      const response = await request(app)
        .post("/api/v1/dashboard/seasons")
        .set("Authorization", `Bearer ${adminJWT}`)
        .send(seasonData)
        .expect(400);

      expect(response.body).toHaveProperty("issues");
      expect(response.body.issues[0]?.message).toContain(
        "At least one map must be selected"
      );
    });

    it("should reject missing active_map_pool field", async () => {
      const adminJWT = generateTestJWT();
      const seasonData = {
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Test Season",
        full_name: "Test Season Full Name",
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        platform: "faceit",
        is_round_robin_bo2_as_2xbo1: false,
        has_vat: true
        // active_map_pool is missing
      };

      const response = await request(app)
        .post("/api/v1/dashboard/seasons")
        .set("Authorization", `Bearer ${adminJWT}`)
        .send(seasonData)
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });
  });

  describe("PUT /api/v1/dashboard/seasons/:id", () => {
    beforeEach(async () => {
      // Create a test season
      await runQuery(
        `INSERT INTO Seasons (id, game_id, game_type_id, organizer_id, name, full_name, start_date, end_date, platform, is_round_robin_bo2_as_2xbo1, has_vat)
         VALUES (?, 1, 1, 1, 'Test Season', 'Test Season Full Name', '2024-01-01', '2024-12-31', 'faceit', false, true)`,
        [testSeasonId],
        connection
      );
      // Add initial map pool
      await runQuery(
        `INSERT INTO SeasonActiveMapPool (season_id, map_id) VALUES (?, ?), (?, ?)`,
        [testSeasonId, 1, testSeasonId, 2],
        connection
      );
    });

    it("should update a season with new active_map_pool", async () => {
      const adminJWT = generateTestJWT();
      const seasonData = {
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Updated Season",
        full_name: "Updated Season Full Name",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        platform: "faceit",
        is_round_robin_bo2_as_2xbo1: false,
        has_vat: true,
        active_map_pool: [3, 4, 5]
      };

      await request(app)
        .put(`/api/v1/dashboard/seasons/${testSeasonId}`)
        .set("Authorization", `Bearer ${adminJWT}`)
        .send(seasonData)
        .expect(200);

      // Verify active_map_pool was updated
      const mapPool = await runQuery<Array<{ map_id: number }>>(
        "SELECT map_id FROM SeasonActiveMapPool WHERE season_id = ? ORDER BY map_id ASC",
        [testSeasonId],
        connection
      );
      expect(mapPool.map((row) => row.map_id)).toEqual([3, 4, 5]);
      expect(mapPool.map((row) => row.map_id)).not.toContain(1);
      expect(mapPool.map((row) => row.map_id)).not.toContain(2);
    });

    it("should reject empty active_map_pool array when updating", async () => {
      const adminJWT = generateTestJWT();
      const seasonData = {
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Updated Season",
        full_name: "Updated Season Full Name",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        platform: "faceit",
        is_round_robin_bo2_as_2xbo1: false,
        has_vat: true,
        active_map_pool: []
      };

      const response = await request(app)
        .put(`/api/v1/dashboard/seasons/${testSeasonId}`)
        .set("Authorization", `Bearer ${adminJWT}`)
        .send(seasonData)
        .expect(400);

      expect(response.body).toHaveProperty("issues");
      expect(response.body.issues[0]?.message).toContain(
        "At least one map must be selected"
      );
    });
  });

  describe("GET /api/v1/dashboard/seasons/:id", () => {
    beforeEach(async () => {
      // Create a test season
      await runQuery(
        `INSERT INTO Seasons (id, game_id, game_type_id, organizer_id, name, full_name, start_date, end_date, platform, is_round_robin_bo2_as_2xbo1, has_vat)
         VALUES (?, 1, 1, 1, 'Test Season', 'Test Season Full Name', '2024-01-01', '2024-12-31', 'faceit', false, true)`,
        [testSeasonId],
        connection
      );
      // Add map pool
      await runQuery(
        `INSERT INTO SeasonActiveMapPool (season_id, map_id) VALUES (?, ?), (?, ?), (?, ?)`,
        [testSeasonId, 1, testSeasonId, 2, testSeasonId, 3],
        connection
      );
    });

    it("should return season with active_map_pool", async () => {
      const adminJWT = generateTestJWT();

      const response = await request(app)
        .get(`/api/v1/dashboard/seasons/${testSeasonId}`)
        .set("Authorization", `Bearer ${adminJWT}`)
        .expect(200);

      expect(response.body).toHaveProperty("active_map_pool");
      expect(response.body.active_map_pool).toEqual([1, 2, 3]);
    });
  });
});
