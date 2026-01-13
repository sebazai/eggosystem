// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import type express from "express";
import { createExpressTestApp, setupEnvironment } from "../../test-utils";
import gameRouter from "./game.routes";
import * as gamesControllers from "../../controllers/games.controllers";

jest.mock("../../controllers/games.controllers");

const mockGetGamesController =
  gamesControllers.getGamesController as jest.MockedFunction<
    typeof gamesControllers.getGamesController
  >;
const mockGetGameTypesController =
  gamesControllers.getGameTypesController as jest.MockedFunction<
    typeof gamesControllers.getGameTypesController
  >;
const mockGetGameTypesByGameIdController =
  gamesControllers.getGameTypesByGameIdController as jest.MockedFunction<
    typeof gamesControllers.getGameTypesByGameIdController
  >;

describe("Game Routes Integration Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupEnvironment({
      FRONTEND_URL: "http://localhost:3000"
    });

    const { app: testApp } = createExpressTestApp(gameRouter, "/api/v1/games");
    app = testApp;

    jest.clearAllMocks();

    mockGetGamesController.mockImplementation(async (req, res) => {
      res.status(200).json({ games: [] });
    });
    mockGetGameTypesController.mockImplementation(async (req, res) => {
      res.status(200).json({ types: [] });
    });
    mockGetGameTypesByGameIdController.mockImplementation(async (req, res) => {
      res.status(200).json({ types: [] });
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /", () => {
    it("should return games list without authentication", async () => {
      const res = await request(app).get("/api/v1/games");

      expect(res.status).toBe(200);
      expect(mockGetGamesController).toHaveBeenCalled();
    });
  });

  describe("GET /types", () => {
    it("should return game types without authentication", async () => {
      const res = await request(app).get("/api/v1/games/types");

      expect(res.status).toBe(200);
      expect(mockGetGameTypesController).toHaveBeenCalled();
    });
  });

  describe("GET /:gameId/types", () => {
    it("should return game types for specific game", async () => {
      const res = await request(app).get("/api/v1/games/730/types");

      expect(res.status).toBe(200);
      expect(mockGetGameTypesByGameIdController).toHaveBeenCalled();
    });

    it("should not require authentication", async () => {
      const res = await request(app).get("/api/v1/games/730/types");

      expect(res.status).toBe(200);
    });
  });
});
