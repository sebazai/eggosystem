// Integration tests for season signup requirements functionality
import { createMockSeasonFormRequestBody } from "@eggosystem/types";
import request from "supertest";
import express from "express";
import { runQuery } from "../../db/mysqlRunQuery";
import { getConnection } from "../../db/mysqlConnection";
import type { PoolConnection } from "mysql2/promise";
import { expressErrorHandler } from "../../middlewares/express-error-handler";
import seasonRouter from "../../routes/v1/dashboard/season.routes";
import { generateTestJWT } from "../../utils/auth-test-utils";
import {
  deleteTestSeasonSignupSettings,
  insertTestSeasonSignupSettings
} from "../../__utils__/season-signup-settings-test";

// Mock the auth middleware
jest.mock("../../middlewares/auth.middleware", () => ({
  checkPermissions: jest.fn(
    () => (req: unknown, res: unknown, next: express.NextFunction) => next()
  )
}));

describe("Season Controllers Integration Tests - Signup Requirements", () => {
  let app: express.Application;
  let connection: PoolConnection;
  const testSeasonId = 9996;

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
    await deleteTestSeasonSignupSettings(testSeasonId, connection);
    await runQuery(
      "DELETE FROM Seasons WHERE id = ?",
      [testSeasonId],
      connection
    );
  };

  describe("POST /api/v1/dashboard/seasons - Signup Requirements", () => {
    it("should create a season with signup requirements defaulting to false", async () => {
      const adminJWT = generateTestJWT();
      const seasonData = createMockSeasonFormRequestBody();

      const response = await request(app)
        .post("/api/v1/dashboard/seasons")
        .set("Authorization", `Bearer ${adminJWT}`)
        .send(seasonData)
        .expect(201);

      expect(response.body).toHaveProperty("seasonId");
      const createdSeasonId = response.body.seasonId;

      try {
        // Verify signup requirements are stored as false
        const [storedSeason] = await runQuery<
          Array<{
            faceit_rank_required: boolean;
            premier_rank_required: boolean;
            hours_played_required: boolean;
          }>
        >(
          "SELECT faceit_rank_required, premier_rank_required, hours_played_required FROM Seasons WHERE id = ?",
          [createdSeasonId],
          connection
        );

        expect(storedSeason).toBeDefined();
        expect(storedSeason?.faceit_rank_required).toBe(false);
        expect(storedSeason?.premier_rank_required).toBe(false);
        expect(storedSeason?.hours_played_required).toBe(false);
      } finally {
        // Clean up
        await runQuery(
          "DELETE FROM SeasonActiveMapPool WHERE season_id = ?",
          [createdSeasonId],
          connection
        );
        await deleteTestSeasonSignupSettings(createdSeasonId, connection);
        await runQuery(
          "DELETE FROM Seasons WHERE id = ?",
          [createdSeasonId],
          connection
        );
      }
    });

    it("should create a season with signup requirements explicitly set to true", async () => {
      const adminJWT = generateTestJWT();
      const seasonData = createMockSeasonFormRequestBody({
        faceit_rank_required: true,
        premier_rank_required: true,
        hours_played_required: true
      });

      const response = await request(app)
        .post("/api/v1/dashboard/seasons")
        .set("Authorization", `Bearer ${adminJWT}`)
        .send(seasonData)
        .expect(201);

      expect(response.body).toHaveProperty("seasonId");
      const createdSeasonId = response.body.seasonId;

      try {
        // Verify signup requirements are stored as true
        const [storedSeason] = await runQuery<
          Array<{
            faceit_rank_required: boolean;
            premier_rank_required: boolean;
            hours_played_required: boolean;
          }>
        >(
          "SELECT faceit_rank_required, premier_rank_required, hours_played_required FROM Seasons WHERE id = ?",
          [createdSeasonId],
          connection
        );

        expect(storedSeason).toBeDefined();
        expect(storedSeason?.faceit_rank_required).toBe(true);
        expect(storedSeason?.premier_rank_required).toBe(true);
        expect(storedSeason?.hours_played_required).toBe(true);
      } finally {
        // Clean up
        await runQuery(
          "DELETE FROM SeasonActiveMapPool WHERE season_id = ?",
          [createdSeasonId],
          connection
        );
        await deleteTestSeasonSignupSettings(createdSeasonId, connection);
        await runQuery(
          "DELETE FROM Seasons WHERE id = ?",
          [createdSeasonId],
          connection
        );
      }
    });
  });

  describe("PUT /api/v1/dashboard/seasons/:id - Signup Requirements", () => {
    beforeEach(async () => {
      // Create a test season with default values (all false)
      await runQuery(
        `INSERT INTO Seasons (
          id, game_id, game_type_id, organizer_id, name, full_name,
          start_date, end_date, platform, is_round_robin_bo2_as_2xbo1, has_vat,
          faceit_rank_required, premier_rank_required, hours_played_required
        ) VALUES (?, 1, 1, 1, 'Test Season', 'Test Season Full Name',
          '2024-01-01', '2024-12-31', 'faceit', false, true,
          false, false, false)`,
        [testSeasonId],
        connection
      );
      await insertTestSeasonSignupSettings(testSeasonId, undefined, connection);
      // Add map pool
      await runQuery(
        `INSERT INTO SeasonActiveMapPool (season_id, map_id) VALUES (?, ?), (?, ?)`,
        [testSeasonId, 1, testSeasonId, 2],
        connection
      );
    });

    it("should update signup requirements to true", async () => {
      const adminJWT = generateTestJWT();
      const seasonData = createMockSeasonFormRequestBody({
        name: "Updated Season",
        full_name: "Updated Season Full Name",
        start_date: "2024-01-01",
        active_map_pool: [3, 4, 5],
        faceit_rank_required: true,
        premier_rank_required: true,
        hours_played_required: true
      });

      await request(app)
        .put(`/api/v1/dashboard/seasons/${testSeasonId}`)
        .set("Authorization", `Bearer ${adminJWT}`)
        .send(seasonData)
        .expect(200);

      // Verify signup requirements were updated to true
      const [storedSeason] = await runQuery<
        Array<{
          faceit_rank_required: boolean;
          premier_rank_required: boolean;
          hours_played_required: boolean;
        }>
      >(
        "SELECT faceit_rank_required, premier_rank_required, hours_played_required FROM Seasons WHERE id = ?",
        [testSeasonId],
        connection
      );

      expect(storedSeason).toBeDefined();
      expect(storedSeason?.faceit_rank_required).toBe(true);
      expect(storedSeason?.premier_rank_required).toBe(true);
      expect(storedSeason?.hours_played_required).toBe(true);
    });

    it("should update signup requirements to false", async () => {
      const adminJWT = generateTestJWT();
      // First, create a season with all requirements true
      await runQuery(
        `UPDATE Seasons SET 
          faceit_rank_required = true,
          premier_rank_required = true,
          hours_played_required = true
        WHERE id = ?`,
        [testSeasonId],
        connection
      );

      const seasonData = createMockSeasonFormRequestBody({
        name: "Updated Season",
        full_name: "Updated Season Full Name",
        start_date: "2024-01-01",
        active_map_pool: [3, 4, 5],
        faceit_rank_required: false,
        premier_rank_required: false,
        hours_played_required: false
      });

      await request(app)
        .put(`/api/v1/dashboard/seasons/${testSeasonId}`)
        .set("Authorization", `Bearer ${adminJWT}`)
        .send(seasonData)
        .expect(200);

      // Verify signup requirements were updated to false
      const [storedSeason] = await runQuery<
        Array<{
          faceit_rank_required: boolean;
          premier_rank_required: boolean;
          hours_played_required: boolean;
        }>
      >(
        "SELECT faceit_rank_required, premier_rank_required, hours_played_required FROM Seasons WHERE id = ?",
        [testSeasonId],
        connection
      );

      expect(storedSeason).toBeDefined();
      expect(storedSeason?.faceit_rank_required).toBe(false);
      expect(storedSeason?.premier_rank_required).toBe(false);
      expect(storedSeason?.hours_played_required).toBe(false);
    });
  });

  describe("GET /api/v1/dashboard/seasons/:id - Signup Requirements", () => {
    beforeEach(async () => {
      // Create a test season with specific signup requirements
      await runQuery(
        `INSERT INTO Seasons (
          id, game_id, game_type_id, organizer_id, name, full_name,
          start_date, end_date, platform, is_round_robin_bo2_as_2xbo1, has_vat,
          faceit_rank_required, premier_rank_required, hours_played_required
        ) VALUES (?, 1, 1, 1, 'Test Season', 'Test Season Full Name',
          '2024-01-01', '2024-12-31', 'faceit', false, true,
          true, false, false)`,
        [testSeasonId],
        connection
      );
      await insertTestSeasonSignupSettings(testSeasonId, undefined, connection);
      // Add map pool
      await runQuery(
        `INSERT INTO SeasonActiveMapPool (season_id, map_id) VALUES (?, ?), (?, ?)`,
        [testSeasonId, 1, testSeasonId, 2],
        connection
      );
    });

    it("should return season with signup requirements", async () => {
      const adminJWT = generateTestJWT();

      const response = await request(app)
        .get(`/api/v1/dashboard/seasons/${testSeasonId}`)
        .set("Authorization", `Bearer ${adminJWT}`)
        .expect(200);

      expect(response.body).toHaveProperty("faceit_rank_required");
      expect(response.body).toHaveProperty("premier_rank_required");
      expect(response.body).toHaveProperty("hours_played_required");

      expect(response.body.faceit_rank_required).toBe(true);
      expect(response.body.premier_rank_required).toBe(false);
      expect(response.body.hours_played_required).toBe(false);
    });
  });
});
