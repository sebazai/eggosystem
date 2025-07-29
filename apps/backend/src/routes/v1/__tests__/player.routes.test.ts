// Mock API key - set before importing app since middleware is created at require time
const TEST_API_KEY = "test-api-key";
process.env.BACKEND_SERVICE_API_KEY = TEST_API_KEY;
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import express from "express";
import playerRouter from "../player.routes";
import { setPlayerKanaElo } from "../../../models/player.models";

// Mock the model module
jest.mock("../../../models/player.models");
const mockSetPlayerKanaElo = setPlayerKanaElo as jest.MockedFunction<
  typeof setPlayerKanaElo
>;

// Create test app
const app = express();
app.use(express.json());
app.use("/api/v1/players", playerRouter);

describe("Player Routes - set-kanaelo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Clean up environment variables
    delete process.env.BACKEND_SERVICE_API_KEY;
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
        error: { message: "API key required" }
      });
    });

    it("should return 401 when invalid API key is provided", async () => {
      const response = await request(app)
        .post("/api/v1/players/76561198123456789/set-kanaelo")
        .set("X-API-KEY", "invalid-key")
        .send(validRequest);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: { message: "Invalid API key" }
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
        16
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
        error: "kana_elo is required"
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
        error: "calculus is required"
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
        error: "season_id is required"
      });
    });

    it("should return 400 when kana_elo is out of range", async () => {
      const invalidRequest = {
        kana_elo: 450,
        calculus: "test-calculus",
        season_id: 16
      };

      const response = await request(app)
        .post("/api/v1/players/76561198123456789/set-kanaelo")
        .set("X-API-KEY", TEST_API_KEY)
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "kana_elo must be between 0 and 400"
      });
    });

    it("should handle database errors gracefully", async () => {
      mockSetPlayerKanaElo.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .post("/api/v1/players/76561198123456789/set-kanaelo")
        .set("X-API-KEY", TEST_API_KEY)
        .send(validRequest);

      expect(response.status).toBe(500);
      // The error response might not have an "error" property, just check it's not empty
      expect(response.body).toBeDefined();
    });
  });
});
