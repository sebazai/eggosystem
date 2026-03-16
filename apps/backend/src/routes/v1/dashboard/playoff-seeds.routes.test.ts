process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import type express from "express";
import { createExpressTestApp, setupEnvironment } from "../../../test-utils";
import playoffSeedsRouter from "./playoff-seeds.routes";
import * as playoffSeedsControllers from "../../../controllers/dashboard/playoff-seeds.controllers";

jest.mock("../../../controllers/dashboard/playoff-seeds.controllers");

const mockGetPlayoffSeedLeaguesController =
  playoffSeedsControllers.getPlayoffSeedLeaguesController as jest.MockedFunction<
    typeof playoffSeedsControllers.getPlayoffSeedLeaguesController
  >;
const mockGetPlayoffSeedsController =
  playoffSeedsControllers.getPlayoffSeedsController as jest.MockedFunction<
    typeof playoffSeedsControllers.getPlayoffSeedsController
  >;
const mockPutPlayoffSeedsController =
  playoffSeedsControllers.putPlayoffSeedsController as jest.MockedFunction<
    typeof playoffSeedsControllers.putPlayoffSeedsController
  >;

describe("Playoff Seeds Routes", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupEnvironment({ FRONTEND_URL: "http://localhost:3000" });
    const { app: testApp } = createExpressTestApp(
      playoffSeedsRouter,
      "/api/v1/dashboard/playoff-seeds"
    );
    app = testApp;
    jest.clearAllMocks();
    mockGetPlayoffSeedLeaguesController.mockImplementation(
      async (_req, res) => {
        res.status(200).json([]);
      }
    );
    mockGetPlayoffSeedsController.mockImplementation(async (_req, res) => {
      res.status(200).json([]);
    });
    mockPutPlayoffSeedsController.mockImplementation(async (_req, res) => {
      res.status(200).json([]);
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /season/:season_id/leagues", () => {
    it("calls controller with valid season_id", async () => {
      const res = await request(app).get(
        "/api/v1/dashboard/playoff-seeds/season/14/leagues"
      );
      expect(res.status).toBe(200);
      expect(mockGetPlayoffSeedLeaguesController).toHaveBeenCalled();
    });
  });

  describe("GET /season/:season_id/league/:league_id", () => {
    it("calls controller with valid params", async () => {
      const res = await request(app).get(
        "/api/v1/dashboard/playoff-seeds/season/14/league/1"
      );
      expect(res.status).toBe(200);
      expect(mockGetPlayoffSeedsController).toHaveBeenCalled();
    });
  });

  describe("PUT /season/:season_id/league/:league_id", () => {
    it("calls controller with valid body", async () => {
      const res = await request(app)
        .put("/api/v1/dashboard/playoff-seeds/season/14/league/1")
        .send({ seeds: [{ team_id: 10, playoff_seed: 1 }] });
      expect(res.status).toBe(200);
      expect(mockPutPlayoffSeedsController).toHaveBeenCalled();
    });
  });
});
