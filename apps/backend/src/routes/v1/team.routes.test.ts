// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import type express from "express";
import { createExpressTestApp, setupEnvironment } from "../../test-utils";
import teamRouter from "./team.routes";
import * as teamsControllers from "../../controllers/teams.controllers";
import * as rosterHistoryModels from "../../models/roster-history.models";

// Mock controllers and models
jest.mock("../../controllers/teams.controllers");
jest.mock("../../models/roster-history.models");

const mockGetAllTeams = teamsControllers.getAllTeams as jest.MockedFunction<
  typeof teamsControllers.getAllTeams
>;
const mockGetTeamByIdController =
  teamsControllers.getTeamByIdController as jest.MockedFunction<
    typeof teamsControllers.getTeamByIdController
  >;
const mockGetTeamsWithoutOrgController =
  teamsControllers.getTeamsWithoutOrgController as jest.MockedFunction<
    typeof teamsControllers.getTeamsWithoutOrgController
  >;
const mockGetTeamRosterHistory =
  rosterHistoryModels.getTeamRosterHistory as jest.MockedFunction<
    typeof rosterHistoryModels.getTeamRosterHistory
  >;

describe("Team Routes Integration Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupEnvironment({
      FRONTEND_URL: "http://localhost:3000"
    });

    const { app: testApp } = createExpressTestApp(teamRouter, "/api/v1/teams");
    app = testApp;

    jest.clearAllMocks();

    // Setup default mocks
    mockGetAllTeams.mockImplementation(async (req, res) => {
      res.status(200).json({ teams: [] });
    });
    mockGetTeamByIdController.mockImplementation(async (req, res) => {
      res.status(200).json({ id: req.params.team_id });
    });
    mockGetTeamsWithoutOrgController.mockImplementation(async (req, res) => {
      res.status(200).json({ teams: [] });
    });
    mockGetTeamRosterHistory.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /", () => {
    it("should return teams list without authentication", async () => {
      const res = await request(app).get("/api/v1/teams");

      expect(res.status).toBe(200);
      expect(mockGetAllTeams).toHaveBeenCalled();
    });

    it("should handle errors properly", async () => {
      mockGetAllTeams.mockImplementation(async () => {
        throw new Error("Database error");
      });

      const res = await request(app).get("/api/v1/teams");

      // Generic errors default to 400 status in error handler
      expect(res.status).toBe(400);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    });
  });

  describe("GET /org-missing", () => {
    it("should return teams without org without authentication", async () => {
      const res = await request(app).get("/api/v1/teams/org-missing");

      expect(res.status).toBe(200);
      expect(mockGetTeamsWithoutOrgController).toHaveBeenCalled();
    });
  });

  describe("GET /:team_id", () => {
    it("should validate numeric params", async () => {
      const res = await request(app).get("/api/v1/teams/invalid");

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
    });

    it("should return team by id with valid numeric param", async () => {
      const res = await request(app).get("/api/v1/teams/123");

      expect(res.status).toBe(200);
      expect(mockGetTeamByIdController).toHaveBeenCalled();
      expect(res.body.id).toBe("123");
    });

    it("should handle negative numbers", async () => {
      const res = await request(app).get("/api/v1/teams/-1");

      // parseInt("-1") returns -1, which is a valid number
      // The middleware validates it's a number, not that it's positive
      expect(res.status).toBe(200);
    });
  });

  describe("GET /:team_id/trophies", () => {
    it("should validate numeric params", async () => {
      const res = await request(app).get("/api/v1/teams/invalid/trophies");

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
    });

    it("should return team trophies without authentication", async () => {
      const res = await request(app).get("/api/v1/teams/123/trophies");

      expect(res.status).toBe(200);
    });

    it("should apply CORS middleware", async () => {
      const res = await request(app)
        .get("/api/v1/teams/123/trophies")
        .set("Origin", "http://localhost:3000");

      expect(res.headers["access-control-allow-credentials"]).toBe("true");
    });
  });

  describe("GET /:team_id/roster-history", () => {
    it("should validate numeric params", async () => {
      const res = await request(app).get(
        "/api/v1/teams/invalid/roster-history"
      );

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
    });

    it("should require authentication", async () => {
      const res = await request(app).get("/api/v1/teams/123/roster-history");

      expect(res.status).toBe(401);
    });

    it("should return roster history when authenticated", async () => {
      const res = await request(app)
        .get("/api/v1/teams/123/roster-history")
        .set("Authorization", "Bearer valid_token");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("seasons");
      expect(Array.isArray(res.body.seasons)).toBe(true);
      expect(mockGetTeamRosterHistory).toHaveBeenCalledWith(123);
    });

    it("should handle errors from getTeamRosterHistory", async () => {
      mockGetTeamRosterHistory.mockRejectedValue(new Error("Database error"));

      const res = await request(app)
        .get("/api/v1/teams/123/roster-history")
        .set("Authorization", "Bearer valid_token");

      // Generic errors default to 400 status in error handler
      expect(res.status).toBe(400);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    });
  });
});
