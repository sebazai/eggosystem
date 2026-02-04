// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import type express from "express";
import { createExpressTestApp, setupEnvironment } from "../../test-utils";
import casterRouter from "./caster.routes";
import * as casterControllers from "../../controllers/caster.controllers";

jest.mock("../../controllers/caster.controllers");

const mockGetLeaguesBySeasonController =
  casterControllers.getLeaguesBySeasonController as jest.MockedFunction<
    typeof casterControllers.getLeaguesBySeasonController
  >;
const mockGetSeasonActiveMapPoolController =
  casterControllers.getSeasonActiveMapPoolController as jest.MockedFunction<
    typeof casterControllers.getSeasonActiveMapPoolController
  >;

describe("Caster Routes Integration Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupEnvironment({
      FRONTEND_URL: "http://localhost:3000"
    });

    const { app: testApp } = createExpressTestApp(
      casterRouter,
      "/api/v1/casters"
    );
    app = testApp;

    jest.clearAllMocks();

    mockGetLeaguesBySeasonController.mockImplementation(async (req, res) => {
      res.status(200).json({ leagues: [] });
    });
    mockGetSeasonActiveMapPoolController.mockImplementation(
      async (req, res) => {
        res.status(200).json([]);
      }
    );
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /seasons/:season_id/leagues", () => {
    it("should validate numeric params", async () => {
      const res = await request(app).get(
        "/api/v1/casters/seasons/invalid/leagues"
      );

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
    });

    it("should return leagues for season", async () => {
      const res = await request(app).get("/api/v1/casters/seasons/1/leagues");

      expect(res.status).toBe(200);
      expect(mockGetLeaguesBySeasonController).toHaveBeenCalled();
    });

    it("should not require authentication", async () => {
      const res = await request(app).get("/api/v1/casters/seasons/1/leagues");

      expect(res.status).toBe(200);
    });
  });

  describe("GET /seasons/:season_id/active-map-pool", () => {
    it("should validate numeric params", async () => {
      const res = await request(app).get(
        "/api/v1/casters/seasons/invalid/active-map-pool"
      );

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
    });

    it("should return active map pool for season", async () => {
      const res = await request(app).get(
        "/api/v1/casters/seasons/1/active-map-pool"
      );

      expect(res.status).toBe(200);
      expect(mockGetSeasonActiveMapPoolController).toHaveBeenCalled();
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("GET /seasons/:season_id/league/:league_id/teams", () => {
    it("should validate numeric params", async () => {
      const res = await request(app).get(
        "/api/v1/casters/seasons/invalid/league/123/teams"
      );

      expect(res.status).toBe(400);
    });
  });

  describe("GET /players/:steam_id", () => {
    it("should not require authentication", async () => {
      const res = await request(app).get(
        "/api/v1/casters/players/76561198049745649"
      );

      expect(res.status).toBe(200);
    });
  });
});
