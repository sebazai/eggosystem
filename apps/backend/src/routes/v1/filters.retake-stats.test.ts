// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import express from "express";
import { createExpressTestApp } from "../../test-utils";
import { type TeamRetakeStats } from "@eggosystem/types";
import filterRouter from "./filter.routes";
import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";

describe("Retake Stats Integration Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    // Create a custom router that includes the parseQueryFilterParams middleware
    const customRouter = express.Router();
    customRouter.use(parseQueryFilterParams);
    customRouter.use(filterRouter);

    // Use the utility to set up the app with FRONTEND_URL
    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      customRouter,
      "/api/v1/filters"
    );
    app = testApp;
    cleanup = appCleanup;
  });

  afterEach(() => {
    cleanup();
  });
  it("should return correct retake stats for team 1650", async () => {
    const expectedResponse = {
      success: true,
      data: [
        {
          season_id: 14,
          season_name: "Season 2",
          map_id: 8,
          map_name: "de_ancient",
          team_id: 1650,
          team_name: "7dos",
          afterplant_total: 10,
          afterplant_won: 5,
          afterplant_a_total: 5,
          afterplant_a_won: 2,
          afterplant_b_total: 5,
          afterplant_b_won: 3,
          retake_total: 18,
          retake_won: 2,
          retake_a_total: 9,
          retake_a_won: 1,
          retake_b_total: 9,
          retake_b_won: 1,
          afterplant_win_percentage: 50,
          retake_win_percentage: 11
        },
        {
          season_id: 14,
          season_name: "Season 2",
          map_id: 9,
          map_name: "de_anubis",
          team_id: 1650,
          team_name: "7dos",
          afterplant_total: 36,
          afterplant_won: 20,
          afterplant_a_total: 20,
          afterplant_a_won: 13,
          afterplant_b_total: 16,
          afterplant_b_won: 7,
          retake_total: 31,
          retake_won: 7,
          retake_a_total: 16,
          retake_a_won: 4,
          retake_b_total: 15,
          retake_b_won: 3,
          afterplant_win_percentage: 56,
          retake_win_percentage: 23
        },
        {
          season_id: 14,
          season_name: "Season 2",
          map_id: 3,
          map_name: "de_dust2",
          team_id: 1650,
          team_name: "7dos",
          afterplant_total: 17,
          afterplant_won: 7,
          afterplant_a_total: 5,
          afterplant_a_won: 2,
          afterplant_b_total: 12,
          afterplant_b_won: 5,
          retake_total: 7,
          retake_won: 2,
          retake_a_total: 2,
          retake_a_won: 0,
          retake_b_total: 5,
          retake_b_won: 2,
          afterplant_win_percentage: 41,
          retake_win_percentage: 29
        },
        {
          season_id: 14,
          season_name: "Season 2",
          map_id: 1,
          map_name: "de_mirage",
          team_id: 1650,
          team_name: "7dos",
          afterplant_total: 17,
          afterplant_won: 8,
          afterplant_a_total: 11,
          afterplant_a_won: 7,
          afterplant_b_total: 6,
          afterplant_b_won: 1,
          retake_total: 9,
          retake_won: 4,
          retake_a_total: 5,
          retake_a_won: 3,
          retake_b_total: 4,
          retake_b_won: 1,
          afterplant_win_percentage: 47,
          retake_win_percentage: 44
        },
        {
          season_id: 14,
          season_name: "Season 2",
          map_id: 5,
          map_name: "de_nuke",
          team_id: 1650,
          team_name: "7dos",
          afterplant_total: 32,
          afterplant_won: 17,
          afterplant_a_total: 16,
          afterplant_a_won: 9,
          afterplant_b_total: 16,
          afterplant_b_won: 8,
          retake_total: 17,
          retake_won: 6,
          retake_a_total: 9,
          retake_a_won: 3,
          retake_b_total: 8,
          retake_b_won: 3,
          afterplant_win_percentage: 53,
          retake_win_percentage: 35
        }
      ]
    };

    // Make the API request with required query parameters
    const response = await request(app)
      .get("/api/v1/filters/stats/teams/1650/retake-stats?season_ids=14")
      .expect("Content-Type", /json/)
      .expect(200);

    // Check that the response is successful
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();

    // Sort the data arrays by map_id for consistent comparison
    const sortedExpected = expectedResponse.data.sort(
      (a, b) => a.map_id - b.map_id
    );
    const sortedActual = response.body.data.sort(
      (a: TeamRetakeStats, b: TeamRetakeStats) => a.map_id - b.map_id
    );

    // Strict comparison of entire response
    expect(sortedActual).toEqual(sortedExpected);

    // Test each map's data separately for easier debugging
    sortedExpected.forEach((expectedMap, index) => {
      const actualMap = sortedActual[index];

      expect(actualMap.season_id).toBe(expectedMap.season_id);
      expect(actualMap.map_id).toBe(expectedMap.map_id);
      expect(actualMap.team_id).toBe(expectedMap.team_id);
      expect(actualMap.afterplant_total).toBe(expectedMap.afterplant_total);
      expect(actualMap.afterplant_won).toBe(expectedMap.afterplant_won);
      expect(actualMap.afterplant_a_total).toBe(expectedMap.afterplant_a_total);
      expect(actualMap.afterplant_a_won).toBe(expectedMap.afterplant_a_won);
      expect(actualMap.afterplant_b_total).toBe(expectedMap.afterplant_b_total);
      expect(actualMap.afterplant_b_won).toBe(expectedMap.afterplant_b_won);
      expect(actualMap.retake_total).toBe(expectedMap.retake_total);
      expect(actualMap.retake_won).toBe(expectedMap.retake_won);
      expect(actualMap.retake_a_total).toBe(expectedMap.retake_a_total);
      expect(actualMap.retake_a_won).toBe(expectedMap.retake_a_won);
      expect(actualMap.retake_b_total).toBe(expectedMap.retake_b_total);
      expect(actualMap.retake_b_won).toBe(expectedMap.retake_b_won);
      expect(actualMap.afterplant_win_percentage).toBe(
        expectedMap.afterplant_win_percentage
      );
      expect(actualMap.retake_win_percentage).toBe(
        expectedMap.retake_win_percentage
      );
    });
  });

  it("should filter retake stats by map_id", async () => {
    const expectedNukeData = {
      season_id: 14,
      season_name: "Season 2",
      map_id: 5,
      map_name: "de_nuke",
      team_id: 1650,
      team_name: "7dos",
      afterplant_total: 32,
      afterplant_won: 17,
      afterplant_a_total: 16,
      afterplant_a_won: 9,
      afterplant_b_total: 16,
      afterplant_b_won: 8,
      retake_total: 17,
      retake_won: 6,
      retake_a_total: 9,
      retake_a_won: 3,
      retake_b_total: 8,
      retake_b_won: 3,
      afterplant_win_percentage: 53,
      retake_win_percentage: 35
    };

    // Make the API request with map_id filter
    const response = await request(app)
      .get("/api/v1/filters/stats/teams/1650/retake-stats?map_ids=5")
      .expect("Content-Type", /json/)
      .expect(200);

    // Check response structure
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.length).toBe(1);

    // Check specific map data
    const nukeData = response.body.data[0];
    expect(nukeData).toEqual(expectedNukeData);
  });
});
