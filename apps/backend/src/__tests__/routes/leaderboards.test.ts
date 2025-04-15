import request from "supertest";
import express, { RequestHandler } from "express";
import type { Request, Response, NextFunction } from "express";
import type { ParsedParams } from "@eggosystem/types";

// Extend Express Request type
interface RequestWithParsedParams extends Request {
  parsedParams: ParsedParams;
}

// Import controller directly
import {
  getMultipleLeaderboardsController,
  getLeaderboardController
} from "../../controllers/leaderboards.controllers";

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

// Mock middleware for single leaderboard endpoint
const mockSingleLeaderboardMiddleware = (
  req: RequestWithParsedParams,
  _res: Response,
  next: NextFunction
) => {
  req.parsedParams = {
    season_ids: [14], // CS2 season 2
    league_ids: [],
    team_ids: [],
    stages: [],
    map_ids: [],
    leaderboards: "kast" // Explicitly set to KAST
  } as ParsedParams;
  next();
};

// Mock Express app
const app = express();
app.use(express.json());

// Set up the multiple leaderboards endpoint
app.use(
  "/multiple",
  mockMultipleLeaderboardsMiddleware as RequestHandler,
  (req, res) =>
    getMultipleLeaderboardsController(req as RequestWithParsedParams, res)
);

// Set up the single leaderboard endpoint
app.use(
  "/single",
  mockSingleLeaderboardMiddleware as RequestHandler,
  (req, res) => getLeaderboardController(req as RequestWithParsedParams, res)
);

describe("Leaderboards Routes", () => {
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

  describe("GET /single", () => {
    it("should handle simple leaderboard request for KAST", async () => {
      const response = await request(app)
        .get("/single")
        .expect("Content-Type", /json/)
        .expect(200);

      // Verify it's an array
      expect(Array.isArray(response.body)).toBe(true);

      // Basic structure checks only
      if (response.body.length > 0) {
        const player = response.body[0];
        expect(player).toHaveProperty("nickname");
        expect(player).toHaveProperty("team_name");
      }
    });
  });
});
