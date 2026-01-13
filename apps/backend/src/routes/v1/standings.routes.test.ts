// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import type express from "express";
import { createExpressTestApp, setupEnvironment } from "../../test-utils";
import standingsRouter from "./standings.routes";
import * as standingsControllers from "../../controllers/standings.controllers";

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

  describe("GET /leagues", () => {
    it("should return FaceIT leagues without authentication", async () => {
      const res = await request(app).get("/api/v1/standings/leagues");

      expect(res.status).toBe(200);
      expect(mockGetFaceitLeaguesController).toHaveBeenCalled();
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
    it("should return team external ID", async () => {
      const res = await request(app).get("/api/v1/standings/teams/123");

      expect(res.status).toBe(200);
      expect(mockGetStandingsTeamsExternalIdController).toHaveBeenCalled();
    });

    it("should not require authentication", async () => {
      const res = await request(app).get("/api/v1/standings/teams/123");

      expect(res.status).toBe(200);
    });
  });
});
