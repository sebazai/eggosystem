process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import type express from "express";
import { createExpressTestApp, setupEnvironment } from "../../test-utils";
import playoffRouter from "./playoff.routes";
import * as playoffControllers from "../../controllers/playoff.controllers";

jest.mock("../../controllers/playoff.controllers");

const mockGetPlayoffBracketController =
  playoffControllers.getPlayoffBracketController as jest.MockedFunction<
    typeof playoffControllers.getPlayoffBracketController
  >;

describe("Playoff Routes", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupEnvironment({ FRONTEND_URL: "http://localhost:3000" });
    const { app: testApp } = createExpressTestApp(
      playoffRouter,
      "/api/v1/playoff"
    );
    app = testApp;
    jest.clearAllMocks();
    mockGetPlayoffBracketController.mockImplementation(async (_req, res) => {
      res.status(200).json({ matches: [], bracket: { numR1Slots: 0 } });
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /seasons/:season_id/leagues/:league_id/bracket", () => {
    it("returns 400 for invalid season_id", async () => {
      const res = await request(app).get(
        "/api/v1/playoff/seasons/foo/leagues/2/bracket"
      );
      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
      expect(mockGetPlayoffBracketController).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid league_id", async () => {
      const res = await request(app).get(
        "/api/v1/playoff/seasons/1/leagues/bar/bracket"
      );
      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
      expect(mockGetPlayoffBracketController).not.toHaveBeenCalled();
    });

    it("calls controller and returns 200 with valid params", async () => {
      const res = await request(app).get(
        "/api/v1/playoff/seasons/1/leagues/2/bracket"
      );
      expect(res.status).toBe(200);
      expect(mockGetPlayoffBracketController).toHaveBeenCalled();
      expect(res.body).toEqual({ matches: [], bracket: { numR1Slots: 0 } });
    });
  });
});
