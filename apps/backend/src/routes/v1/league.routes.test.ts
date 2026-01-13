// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import type express from "express";
import { createExpressTestApp, setupEnvironment } from "../../test-utils";
import leagueRouter from "./league.routes";
import * as leaguesControllers from "../../controllers/leagues.controllers";

jest.mock("../../controllers/leagues.controllers");

const mockGetAllLeagues =
  leaguesControllers.getAllLeagues as jest.MockedFunction<
    typeof leaguesControllers.getAllLeagues
  >;

describe("League Routes Integration Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupEnvironment({
      FRONTEND_URL: "http://localhost:3000"
    });

    const { app: testApp } = createExpressTestApp(
      leagueRouter,
      "/api/v1/leagues"
    );
    app = testApp;

    jest.clearAllMocks();

    mockGetAllLeagues.mockImplementation(async (req, res) => {
      res.status(200).json({ leagues: [] });
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /", () => {
    it("should return leagues list without authentication", async () => {
      const res = await request(app).get("/api/v1/leagues");

      expect(res.status).toBe(200);
      expect(mockGetAllLeagues).toHaveBeenCalled();
    });

    it("should handle errors properly", async () => {
      mockGetAllLeagues.mockImplementation(async () => {
        throw new Error("Database error");
      });

      const res = await request(app).get("/api/v1/leagues");

      // Generic errors default to 400 status in error handler
      expect(res.status).toBe(400);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    });
  });
});
