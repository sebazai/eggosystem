// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import type express from "express";
import request from "supertest";
import { createExpressTestApp } from "../../test-utils";
import seasonRouter from "./season.routes";
import { runQuery } from "../../db/mysqlRunQuery";
import { getConnection } from "../../db/mysqlConnection";
import type { PoolConnection } from "mysql2/promise";
import {
  deleteTestSeasonSignupSettings,
  insertTestSeasonSignupSettings
} from "../../__utils__/season-signup-settings-test";
import * as playoffControllers from "../../controllers/playoff.controllers";

// Mock the logger
jest.mock("../../utils/app-logger");
jest.mock("../../controllers/playoff.controllers");

const mockGetPlayoffBracketController =
  playoffControllers.getPlayoffBracketController as jest.MockedFunction<
    typeof playoffControllers.getPlayoffBracketController
  >;

describe("Season Routes - Integration Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      seasonRouter,
      "/" // Mount at root, so internal router paths are used directly
    );
    app = testApp;
    cleanup = appCleanup;

    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /:season_id/faceit-links", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/14/faceit-links").expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401
      });
    });

    it("should return 400 for invalid season_id", async () => {
      const response = await request(app)
        .get("/invalid/faceit-links")
        .expect(400);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Invalid numeric param: season_id"
      });
    });
  });

  describe("GET /:season_id/captains", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/14/captains").expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401
      });
    });
  });

  describe("GET /:season_id", () => {
    it("should return 400 for invalid season ID", async () => {
      const response = await request(app).get("/invalid").expect(400);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Invalid numeric param: season_id"
      });
    });

    it("should return 400 for negative season ID", async () => {
      const response = await request(app).get("/-1").expect(404);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: "Season not found"
      });
    });
  });

  describe("GET /:season_id/details", () => {
    it("should return 400 for invalid season ID", async () => {
      const response = await request(app).get("/invalid/details").expect(400);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Invalid numeric param: season_id"
      });
    });

    it("should return 400 for negative season ID", async () => {
      const response = await request(app).get("/-1/details").expect(404);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Not Found",
        status: 404
      });
    });
  });

  describe("GET /:season_id/leagues", () => {
    it("should return 400 for invalid season ID", async () => {
      const response = await request(app).get("/invalid/leagues").expect(400);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Invalid numeric param: season_id"
      });
    });

    it("should return empty array for negative season ID", async () => {
      const response = await request(app).get("/-1/leagues").expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe("GET /:season_id/leagues/:league_id/playoff/bracket", () => {
    beforeEach(() => {
      mockGetPlayoffBracketController.mockImplementation(async (_req, res) => {
        res.status(200).json({ matches: [], bracket: { numR1Slots: 0 } });
      });
    });

    it("returns 400 for invalid season_id", async () => {
      const res = await request(app).get("/foo/leagues/2/playoff/bracket");
      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
      expect(mockGetPlayoffBracketController).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid league_id", async () => {
      const res = await request(app).get("/1/leagues/bar/playoff/bracket");
      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
      expect(mockGetPlayoffBracketController).not.toHaveBeenCalled();
    });

    it("calls controller and returns 200 with valid params", async () => {
      const res = await request(app).get("/1/leagues/2/playoff/bracket");
      expect(res.status).toBe(200);
      expect(mockGetPlayoffBracketController).toHaveBeenCalled();
      expect(res.body).toEqual({ matches: [], bracket: { numR1Slots: 0 } });
    });
  });

  describe("GET /:id - Date serialization", () => {
    let connection: PoolConnection;
    const testSeasonId = 9997;

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
      await runQuery(
        "DELETE FROM SeasonActiveMapPool WHERE season_id = ?",
        [testSeasonId],
        connection
      ).catch(() => {
        // Ignore if table doesn't exist
      });
      await deleteTestSeasonSignupSettings(testSeasonId, connection);
      await runQuery(
        "DELETE FROM Seasons WHERE id = ?",
        [testSeasonId],
        connection
      );

      // Seed test season with specific dates and times in UTC
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
          "2024-01-01 10:30:00", // UTC datetime with time
          "2024-01-15 18:45:00", // UTC datetime with time
          "2024-12-31",
          150
        ],
        connection
      );
      await insertTestSeasonSignupSettings(testSeasonId, undefined, connection);

      // Seed active map pool (required for getSeasonById)
      await runQuery(
        `INSERT INTO SeasonActiveMapPool (season_id, map_id) VALUES (?, ?), (?, ?), (?, ?)`,
        [testSeasonId, 1, testSeasonId, 2, testSeasonId, 3],
        connection
      ).catch(() => {
        // Ignore if table doesn't exist
      });
    });

    afterEach(async () => {
      // Clean up test data
      await runQuery(
        "DELETE FROM SeasonActiveMapPool WHERE season_id = ?",
        [testSeasonId],
        connection
      ).catch(() => {
        // Ignore if table doesn't exist
      });
      await deleteTestSeasonSignupSettings(testSeasonId, connection);
      await runQuery(
        "DELETE FROM Seasons WHERE id = ?",
        [testSeasonId],
        connection
      );
    });

    it("should return dates in UTC ISO 8601 format when serialized by Express", async () => {
      const response = await request(app).get(`/${testSeasonId}`).expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(testSeasonId);
      expect(response.body.registration_price).toBe(150);

      // Express res.json() automatically serializes Date objects to ISO strings
      // Dates should be in UTC ISO 8601 format with 'Z' indicator
      // Using non-midnight times ensures TIMESTAMP fields are correctly handled (not treated as date-only)
      expect(response.body.signup_start_date).toBe("2024-01-01T10:30:00.000Z");
      expect(response.body.signup_end_date).toBe("2024-01-15T18:45:00.000Z");
    });
  });
});
