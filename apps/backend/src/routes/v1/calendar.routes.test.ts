// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import type express from "express";
import { createExpressTestApp, setupEnvironment } from "../../test-utils";
import calendarRouter from "./calendar.routes";
import * as calendarControllers from "../../controllers/calendar.controllers";

jest.mock("../../controllers/calendar.controllers");

const mockGetMatchesBySeasonAndLeagueController =
  calendarControllers.getMatchesBySeasonAndLeagueController as jest.MockedFunction<
    typeof calendarControllers.getMatchesBySeasonAndLeagueController
  >;
const mockGetMatchesByOrganizerAndAppController =
  calendarControllers.getMatchesByOrganizerAndAppController as jest.MockedFunction<
    typeof calendarControllers.getMatchesByOrganizerAndAppController
  >;

describe("Calendar Routes Integration Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupEnvironment({
      FRONTEND_URL: "http://localhost:3000"
    });

    const { app: testApp } = createExpressTestApp(
      calendarRouter,
      "/api/v1/calendar"
    );
    app = testApp;

    jest.clearAllMocks();

    mockGetMatchesBySeasonAndLeagueController.mockImplementation(
      async (req, res) => {
        res.status(200).json({ matches: [] });
      }
    );
    mockGetMatchesByOrganizerAndAppController.mockImplementation(
      async (req, res) => {
        res.status(200).json({ matches: [] });
      }
    );
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /seasons/:season_id/leagues/:league_id/matches", () => {
    it("should validate numeric params for season_id", async () => {
      const res = await request(app).get(
        "/api/v1/calendar/seasons/invalid/leagues/123/matches"
      );

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
    });

    it("should call controller with valid params", async () => {
      const res = await request(app).get(
        "/api/v1/calendar/seasons/1/leagues/2/matches"
      );

      expect(res.status).toBe(200);
      expect(mockGetMatchesBySeasonAndLeagueController).toHaveBeenCalled();
    });

    it("should not require authentication", async () => {
      const res = await request(app).get(
        "/api/v1/calendar/seasons/1/leagues/2/matches"
      );

      expect(res.status).toBe(200);
    });
  });

  describe("GET /organizers/:organizer_id/apps/:app_id/matches", () => {
    it("should validate numeric params for organizer_id and app_id", async () => {
      const res = await request(app).get(
        "/api/v1/calendar/organizers/invalid/apps/123/matches"
      );

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
    });

    it("should call controller with valid params", async () => {
      const res = await request(app).get(
        "/api/v1/calendar/organizers/1/apps/730/matches"
      );

      expect(res.status).toBe(200);
      expect(mockGetMatchesByOrganizerAndAppController).toHaveBeenCalled();
    });

    it("should not require authentication", async () => {
      const res = await request(app).get(
        "/api/v1/calendar/organizers/1/apps/730/matches"
      );

      expect(res.status).toBe(200);
    });
  });
});
