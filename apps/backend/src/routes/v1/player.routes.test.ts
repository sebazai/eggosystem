// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.BACKEND_SERVICE_API_KEY = "test-api-key";

import request from "supertest";
import type express from "express";
import { createExpressTestApp, setupEnvironment } from "../../test-utils";
import playerRouter from "./player.routes";
import {
  setPlayerKanaElo,
  getPlayerStatsForLatestSeason
} from "../../models/player.models";

// Mock the model module
jest.mock("../../models/player.models");
const mockSetPlayerKanaElo = setPlayerKanaElo as jest.MockedFunction<
  typeof setPlayerKanaElo
>;
const mockGetPlayerStatsForLatestSeason =
  getPlayerStatsForLatestSeason as jest.MockedFunction<
    typeof getPlayerStatsForLatestSeason
  >;

const TEST_API_KEY = "test-api-key";

describe("Player Routes", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    // Set up environment variables
    cleanup = setupEnvironment({
      FRONTEND_URL: "http://localhost:3000",
      BACKEND_SERVICE_API_KEY: TEST_API_KEY
    });

    // Create test app with player router using the utility
    const { app: testApp } = createExpressTestApp(
      playerRouter,
      "/api/v1/players"
    );
    app = testApp;

    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("POST /:steam_id/set-kanaelo", () => {
    const validRequest = {
      kana_elo: 250,
      calculus: "test-calculus",
      season_id: 16
    };

    it("should return 401 when no API key is provided", async () => {
      const response = await request(app)
        .post("/api/v1/players/76561198123456789/set-kanaelo")
        .send(validRequest);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "API key required",
        instance: "/api/v1/players/76561198123456789/set-kanaelo"
      });
    });

    it("should return 401 when invalid API key is provided", async () => {
      const response = await request(app)
        .post("/api/v1/players/76561198123456789/set-kanaelo")
        .set("X-API-KEY", "invalid-key")
        .send(validRequest);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Invalid API key",
        instance: "/api/v1/players/76561198123456789/set-kanaelo"
      });
    });

    it("should successfully update kanaelo with valid API key", async () => {
      mockSetPlayerKanaElo.mockResolvedValueOnce(true);

      const response = await request(app)
        .post("/api/v1/players/76561198123456789/set-kanaelo")
        .set("X-API-KEY", TEST_API_KEY)
        .send(validRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Kana ELO updated successfully",
        steam_id: "76561198123456789",
        kana_elo: 250,
        calculus: "test-calculus",
        season_id: 16
      });

      expect(mockSetPlayerKanaElo).toHaveBeenCalledWith(
        "76561198123456789",
        250,
        "test-calculus",
        16,
        undefined, // offered_elo parameter
        undefined // connection parameter
      );
    });

    it("should return 400 when kana_elo is missing", async () => {
      const invalidRequest = {
        calculus: "test-calculus",
        season_id: 16
      };

      const response = await request(app)
        .post("/api/v1/players/76561198123456789/set-kanaelo")
        .set("X-API-KEY", TEST_API_KEY)
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "kana_elo is required",
        instance: "/api/v1/players/76561198123456789/set-kanaelo"
      });
    });

    it("should return 400 when calculus is missing", async () => {
      const invalidRequest = {
        kana_elo: 250,
        season_id: 16
      };

      const response = await request(app)
        .post("/api/v1/players/76561198123456789/set-kanaelo")
        .set("X-API-KEY", TEST_API_KEY)
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "calculus is required",
        instance: "/api/v1/players/76561198123456789/set-kanaelo"
      });
    });

    it("should return 400 when season_id is missing", async () => {
      const invalidRequest = {
        kana_elo: 250,
        calculus: "test-calculus"
      };

      const response = await request(app)
        .post("/api/v1/players/76561198123456789/set-kanaelo")
        .set("X-API-KEY", TEST_API_KEY)
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "season_id is required",
        instance: "/api/v1/players/76561198123456789/set-kanaelo"
      });
    });

    it("should handle database errors gracefully", async () => {
      mockSetPlayerKanaElo.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .post("/api/v1/players/76561198123456789/set-kanaelo")
        .set("X-API-KEY", TEST_API_KEY)
        .send({
          kana_elo: 250,
          calculus: "test-calculus",
          season_id: 16
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to update Kana ELO",
        instance: "/api/v1/players/76561198123456789/set-kanaelo"
      });
    });
  });

  describe("GET /:steam_id/latest-season-stats", () => {
    it("should return player stats from latest season", async () => {
      mockGetPlayerStatsForLatestSeason.mockResolvedValueOnce({
        steam_id: "76561197967885016",
        nickname: "enzoj",
        latest_season_id: 14,
        avg_kana_rating: 0.82,
        kpd: 0.92,
        adr: 80.0,
        level: 4
      });

      const response = await request(app)
        .get("/api/v1/players/76561197967885016/latest-season-stats")
        .expect(200);

      expect(response.body).toEqual({
        steam_id: "76561197967885016",
        nickname: "enzoj",
        latest_season_id: 14,
        avg_kana_rating: 0.82,
        kpd: 0.92,
        adr: 80.0,
        level: 4
      });

      expect(mockGetPlayerStatsForLatestSeason).toHaveBeenCalledWith(
        "76561197967885016"
      );
    });

    it("should return 404 for non-existent player", async () => {
      mockGetPlayerStatsForLatestSeason.mockResolvedValueOnce(null);

      const response = await request(app)
        .get("/api/v1/players/12345678901234567/latest-season-stats")
        .expect(404);

      expect(response.body).toEqual({
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: "Player stats not found for latest season",
        instance: "/api/v1/players/12345678901234567/latest-season-stats"
      });

      expect(mockGetPlayerStatsForLatestSeason).toHaveBeenCalledWith(
        "12345678901234567"
      );
    });
  });
});
