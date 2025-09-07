// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import express from "express";
import { createExpressTestApp } from "../../test-utils";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ParsedParams } from "@eggosystem/types";

// Extend Express Request type
interface RequestWithParsedParams extends Request {
  parsedParams: ParsedParams;
}

// Import controller directly
import { getFilteredMultipleLeaderboardsController } from "../../controllers/leaderboards.controllers";

// Mock middleware for multiple leaderboards endpoint
const mockMultipleLeaderboardsMiddleware = (
  req: RequestWithParsedParams,
  _res: Response,
  next: NextFunction
) => {
  req.parsedParams = {
    season_ids: [14], // CS2 season 2
    league_ids: [],
    team_ids: [],
    stages: [],
    map_ids: []
  } as ParsedParams;
  next();
};

describe("Leaderboards Routes", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    // Create a custom router for the leaderboards endpoint
    const customRouter = express.Router();
    customRouter.use(
      "/multiple",
      mockMultipleLeaderboardsMiddleware as RequestHandler,
      (req, res) =>
        getFilteredMultipleLeaderboardsController(
          req as RequestWithParsedParams,
          res
        )
    );

    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      customRouter,
      "/" // Mount at root, so internal router paths are used directly
    );
    app = testApp;
    cleanup = appCleanup;
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /multiple", () => {
    it("should contain correct KAST values for Season 14", async () => {
      const response = await request(app)
        .get("/multiple")
        .expect("Content-Type", /json/)
        .expect(200);

      // Verify the structure of the response
      expect(response.body).toHaveProperty("kast");

      // Get KAST data from response
      const kastData = response.body.kast;

      // Verify it's an array
      expect(Array.isArray(kastData)).toBe(true);

      // Check scale is correct (between 0-100)
      if (kastData && kastData.length > 0) {
        const samplePlayer = kastData[0];
        if (samplePlayer && samplePlayer.kast) {
          expect(samplePlayer.kast).toBeLessThanOrEqual(100);
          expect(samplePlayer.kast).toBeGreaterThan(0);
        }
      }
    });
  });
});
