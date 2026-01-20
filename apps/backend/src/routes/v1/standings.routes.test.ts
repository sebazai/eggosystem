// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import type express from "express";
import { createExpressTestApp, setupEnvironment } from "../../test-utils";
import standingsRouter from "./standings.routes";
import * as standingsControllers from "../../controllers/standings.controllers";
import { BadRequestError } from "../../utils/errors";

jest.mock("../../controllers/standings.controllers");

const mockGetFaceitLeaguesController =
  standingsControllers.getFaceitLeaguesController as jest.MockedFunction<
    typeof standingsControllers.getFaceitLeaguesController
  >;
const mockGetStandingsController =
  standingsControllers.getStandingsController as jest.MockedFunction<
    typeof standingsControllers.getStandingsController
  >;
const mockGetStandingsTeamsExternalIdController =
  standingsControllers.getStandingsTeamsExternalIdController as jest.MockedFunction<
    typeof standingsControllers.getStandingsTeamsExternalIdController
  >;

describe("Standings Routes Integration Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupEnvironment({
      FRONTEND_URL: "http://localhost:3000"
    });

    const { app: testApp } = createExpressTestApp(
      standingsRouter,
      "/api/v1/standings"
    );
    app = testApp;

    jest.clearAllMocks();

    mockGetFaceitLeaguesController.mockImplementation(async (req, res) => {
      res.status(200).json({ leagues: [] });
    });
    mockGetStandingsController.mockImplementation(async (req, res) => {
      res.status(200).json({ standings: [] });
    });
    mockGetStandingsTeamsExternalIdController.mockImplementation(
      async (req, res) => {
        res.status(200).json({ team: {} });
      }
    );
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /season/:season_id/leagues", () => {
    it("should return FaceIT leagues without authentication", async () => {
      const res = await request(app).get("/api/v1/standings/season/1/leagues");

      expect(res.status).toBe(200);
      expect(mockGetFaceitLeaguesController).toHaveBeenCalled();
      expect(mockGetStandingsController).not.toHaveBeenCalled();
    });

    it("should validate numeric season_id param", async () => {
      const res = await request(app).get(
        "/api/v1/standings/season/invalid/leagues"
      );

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
    });
  });

  describe("GET /:faceit_league_id", () => {
    it("should return standings for league", async () => {
      const res = await request(app).get("/api/v1/standings/123");

      expect(res.status).toBe(200);
      expect(mockGetStandingsController).toHaveBeenCalled();
    });

    it("should not require authentication", async () => {
      const res = await request(app).get("/api/v1/standings/123");

      expect(res.status).toBe(200);
    });
  });

  describe("GET /teams/:team_id", () => {
    it("should return team external ID with season_id query param", async () => {
      const res = await request(app).get(
        "/api/v1/standings/teams/123?season_id=1"
      );

      expect(res.status).toBe(200);
      expect(mockGetStandingsTeamsExternalIdController).toHaveBeenCalled();
    });

    it("should return 400 when season_id is missing", async () => {
      mockGetStandingsTeamsExternalIdController.mockImplementation(async () => {
        throw new BadRequestError("Season ID is required");
      });

      const res = await request(app).get("/api/v1/standings/teams/123");

      expect(res.status).toBe(400);
      expect(res.body.detail).toBe("Season ID is required");
    });

    it("should return 400 when season_id is invalid", async () => {
      mockGetStandingsTeamsExternalIdController.mockImplementation(async () => {
        throw new BadRequestError("Season ID is required");
      });

      const res = await request(app).get(
        "/api/v1/standings/teams/123?season_id=invalid"
      );

      expect(res.status).toBe(400);
      expect(res.body.detail).toBe("Season ID is required");
    });

    it("should not require authentication", async () => {
      const res = await request(app).get(
        "/api/v1/standings/teams/123?season_id=1"
      );

      expect(res.status).toBe(200);
    });
  });
});
