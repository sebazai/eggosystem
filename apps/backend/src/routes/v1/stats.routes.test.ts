// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import express from "express";
import { createExpressTestApp } from "../../test-utils";
import filterRouter from "./filter.routes";
import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";
import { type TeamPistolWinStat } from "@eggosystem/types";

// We don't mock models in integration tests as we want to test the full stack
describe("Team Stats Routes - Integration Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    // Create a custom router that includes the parseQueryFilterParams middleware
    const customRouter = express.Router();
    customRouter.use(parseQueryFilterParams);
    customRouter.use(filterRouter);

    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      customRouter,
      "/"
    );
    app = testApp;
    cleanup = appCleanup;
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /api/v1/stats/teams/:teamId/pistol-wins", () => {
    it("should return pistol win statistics for team 1650 in season 14", async () => {
      // Integration test against the real endpoint
      const response = await request(app)
        .get("/stats/teams/1650/pistol-wins?season_ids=14")
        .expect(200);

      // Verify structure of response
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);

      // If data exists in database, validate it matches expected structure
      if (response.body.data.length > 0) {
        const firstItem = response.body.data[0];
        expect(firstItem).toHaveProperty("team_id");
        expect(firstItem).toHaveProperty("team_name");
        expect(firstItem).toHaveProperty("map_id");
        expect(firstItem).toHaveProperty("map_name");
        expect(firstItem).toHaveProperty("pistol_rounds_played");
        expect(firstItem).toHaveProperty("pistol_rounds_won");
        expect(firstItem).toHaveProperty("pistol_win_percentage");
      }

      // Note: In a real integration test environment with known test data,
      // we could add more specific assertions about the actual values
    });

    it("should filter results when map_id is provided", async () => {
      // Test filtering by map
      const response = await request(app)
        .get("/stats/teams/1650/pistol-wins?season_ids=14&map_ids=1")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // If we have results, verify they're all for the requested map
      if (response.body.data.length > 0) {
        response.body.data.forEach((item: TeamPistolWinStat) => {
          expect(item.map_id).toBe(1);
        });
      }
    });

    it("should return exact expected data for team 1650 in season 14 on de_mirage map", async () => {
      const response = await request(app)
        .get("/stats/teams/1650/pistol-wins?season_ids=14&map_ids=1")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);

      // Expected exact result based on manual SQL query
      const expectedResult = {
        season_id: 14,
        season_name: "Season 2",
        map_id: 1,
        map_name: "de_mirage",
        team_id: 1650,
        team_name: "7dos",
        pistol_rounds_played: 4,
        pistol_rounds_won: 4,
        pistol_win_percentage: 100.0
      };

      expect(response.body.data[0]).toEqual(expectedResult);
    });

    it("should handle invalid team IDs gracefully", async () => {
      // Test with a non-existent team ID
      const response = await request(app)
        .get("/stats/teams/999999/pistol-wins")
        .expect(200); // Still returns 200 with empty data array

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });
});
