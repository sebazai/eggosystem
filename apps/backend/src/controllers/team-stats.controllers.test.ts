// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

/** Unit tests: getTeamPlantStatsController (mocked model). Integration: filter.routes team retake & enhanced-map-stats against the test DB. */

import request from "supertest";
import express from "express";
import { createExpressTestApp } from "../test-utils";
import { type TeamRetakeStats } from "@eggosystem/types";
import parseQueryFilterParams from "../middlewares/parse-query-filter-params.middleware";

import { getTeamPlantStats } from "../models/plant-stats.models";
import { getTeamPlantStatsController } from "./team-stats.controllers";
import { type Response } from "express";
import { type RequestWithParams, type ParsedParams } from "@eggosystem/types";
import filterRoutes from "../routes/v1/filter.routes";
import { type TeamMapStats } from "@eggosystem/types";
import { getTeamRetakeStats } from "../models/retake-stats.models";
import { getTeamRetakeStatsController } from "./team-stats.controllers";

// Mock the model
jest.mock("../models/plant-stats.models", () => ({
  getTeamPlantStats: jest.fn()
}));

describe("getTeamPlantStatsController", () => {
  let mockReq: Partial<RequestWithParams<{ team_id: string }>> & {
    parsedParams: ParsedParams;
  };
  let mockRes: Partial<Response>;
  let jsonSpy: jest.Mock;

  beforeEach(() => {
    jsonSpy = jest.fn();
    mockRes = {
      status: jest.fn().mockReturnValue({ json: jsonSpy }),
      json: jsonSpy
    };

    mockReq = {
      params: {
        team_id: "123"
      },
      parsedParams: {
        season_ids: [1],
        league_ids: null,
        team_ids: null,
        stages: null,
        map_ids: null,
        player_name: null
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return plant stats data with status 200", async () => {
    // Mock data
    const mockPlantStats = [
      {
        season_id: 1,
        season_name: "Season 1",
        map_id: 1,
        map_name: "de_dust2",
        team_id: 123,
        team_name: "Test Team",
        planted_a_site: 5,
        planted_b_site: 10,
        no_plants: 8,
        enemy_planted_a_site: 4,
        enemy_planted_b_site: 7,
        enemy_no_plants: 12
      }
    ];

    (getTeamPlantStats as jest.Mock).mockResolvedValue(mockPlantStats);

    // Call controller
    await getTeamPlantStatsController(
      mockReq as RequestWithParams<{ team_id: string }>,
      mockRes as Response
    );

    // Verify model was called with correct parameters
    expect(getTeamPlantStats).toHaveBeenCalledWith(123, mockReq.parsedParams);

    // Verify response
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: true,
      data: mockPlantStats
    });
  });

  it("should convert teamId to number", async () => {
    (getTeamPlantStats as jest.Mock).mockResolvedValue([]);

    // Call controller
    await getTeamPlantStatsController(
      mockReq as RequestWithParams<{ team_id: string }>,
      mockRes as Response
    );

    // Verify teamId was converted to number
    expect(getTeamPlantStats).toHaveBeenCalledWith(123, expect.anything());
  });
});

describe("filter.routes — team stats (integration)", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    const customRouter = express.Router();
    customRouter.use(parseQueryFilterParams);
    customRouter.use(filterRoutes);
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

  describe("GET /teams/:team_id/stats/retakes", () => {
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
        .get("/api/v1/filters/teams/1650/stats/retakes?season_ids=14")
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
        expect(actualMap.afterplant_a_total).toBe(
          expectedMap.afterplant_a_total
        );
        expect(actualMap.afterplant_a_won).toBe(expectedMap.afterplant_a_won);
        expect(actualMap.afterplant_b_total).toBe(
          expectedMap.afterplant_b_total
        );
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

      // Scope to the same season as the full retake snapshot; map_ids alone matches every season that includes this map.
      const response = await request(app)
        .get("/api/v1/filters/teams/1650/stats/retakes?season_ids=14&map_ids=5")
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

  describe("GET /teams/:team_id/enhanced-map-stats", () => {
    it("should return enhanced map stats for a team with proper CT/T side data", async () => {
      const response = await request(app)
        .get("/api/v1/filters/teams/1650/enhanced-map-stats?season_ids=14")
        .expect("Content-Type", /json/)
        .expect(200);

      // Check response structure
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check that each map has the expected properties
      const mapStats = response.body as TeamMapStats[];
      mapStats.forEach((mapStat) => {
        // Basic map stats
        expect(mapStat).toHaveProperty("map_id");
        expect(mapStat).toHaveProperty("map_name");
        expect(mapStat).toHaveProperty("maps_played");
        expect(mapStat).toHaveProperty("wins");
        expect(mapStat).toHaveProperty("losses");
        expect(mapStat).toHaveProperty("win_percentage");
        expect(mapStat).toHaveProperty("avg_score");
        expect(mapStat).toHaveProperty("avg_opponent_score");

        // CT/T side stats (these were previously simulated but now come from database)
        expect(mapStat).toHaveProperty("ct_win_percentage");
        expect(mapStat).toHaveProperty("t_win_percentage");
        expect(mapStat).toHaveProperty("ct_kd");
        expect(mapStat).toHaveProperty("t_kd");

        // Validate types
        expect(typeof mapStat.map_id).toBe("number");
        expect(typeof mapStat.map_name).toBe("string");
        expect(typeof mapStat.maps_played).toBe("number");
        expect(typeof mapStat.ct_win_percentage).toBe("number");
        expect(typeof mapStat.t_win_percentage).toBe("number");
        expect(typeof mapStat.ct_kd).toBe("number");
        expect(typeof mapStat.t_kd).toBe("number");

        // Validate ranges
        expect(mapStat.ct_win_percentage).toBeGreaterThanOrEqual(0);
        expect(mapStat.ct_win_percentage).toBeLessThanOrEqual(100);
        expect(mapStat.t_win_percentage).toBeGreaterThanOrEqual(0);
        expect(mapStat.t_win_percentage).toBeLessThanOrEqual(100);

        // Validate logical consistency
        expect(mapStat.wins).toBeLessThanOrEqual(mapStat.maps_played);
        expect(mapStat.losses).toBeLessThanOrEqual(mapStat.maps_played);
        expect(mapStat.wins + mapStat.losses).toBeLessThanOrEqual(
          mapStat.maps_played
        );
      });
    });

    it("should apply query filters properly", async () => {
      const response = await request(app)
        .get(
          "/api/v1/filters/teams/1650/enhanced-map-stats?season_ids=14&map_ids=1"
        )
        .expect("Content-Type", /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // Should only include maps matching the filter
      const mapStats = response.body as TeamMapStats[];
      expect(mapStats.every((map) => map.map_id === 1)).toBe(true);
    });

    it("should return 400 with invalid team_id", async () => {
      await request(app)
        .get("/api/v1/filters/teams/invalid/enhanced-map-stats?season_ids=14")
        .expect(400);
    });

    it("should return accurate K/D and kill/death stats for team 66 on map 3", async () => {
      const response = await request(app)
        .get(
          "/api/v1/filters/teams/66/enhanced-map-stats?season_ids=14&map_ids=3"
        )
        .expect("Content-Type", /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);

      const mapStat = response.body[0] as TeamMapStats;

      // Verify map ID
      expect(mapStat.map_id).toBe(3);

      // Verify kill/death counts
      expect(mapStat.kills_t).toBe(29);
      expect(mapStat.deaths_t).toBe(50);
      expect(mapStat.kills_ct).toBe(8);
      expect(mapStat.deaths_ct).toBe(19);

      // Verify K/D ratios
      expect(mapStat.t_kd).toBe(0.58);
      expect(mapStat.ct_kd).toBe(0.42);
    });
  });
});

// Mock the model
jest.mock("../models/retake-stats.models", () => ({
  getTeamRetakeStats: jest.fn()
}));

describe("getTeamRetakeStatsController", () => {
  let mockReq: Partial<RequestWithParams<{ team_id: string }>> & {
    parsedParams: ParsedParams;
  };
  let mockRes: Partial<Response>;
  let jsonSpy: jest.Mock;

  beforeEach(() => {
    jsonSpy = jest.fn();
    mockRes = {
      status: jest.fn().mockReturnValue({ json: jsonSpy }),
      json: jsonSpy
    };

    mockReq = {
      params: {
        team_id: "123"
      },
      parsedParams: {
        season_ids: [1],
        league_ids: null,
        team_ids: null,
        stages: null,
        map_ids: null,
        player_name: null
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return retake stats data with status 200", async () => {
    // Mock data
    const mockRetakeStats = [
      {
        season_id: 1,
        season_name: "Season 1",
        map_id: 1,
        map_name: "de_dust2",
        team_id: 123,
        team_name: "Test Team",
        afterplant_total: 10,
        afterplant_won: 6,
        afterplant_win_percentage: 60,
        retake_total: 8,
        retake_won: 3,
        retake_win_percentage: 38
      }
    ];

    (getTeamRetakeStats as jest.Mock).mockResolvedValue(mockRetakeStats);

    // Call controller
    await getTeamRetakeStatsController(
      mockReq as RequestWithParams<{ team_id: string }>,
      mockRes as Response
    );

    // Verify model was called with correct parameters
    expect(getTeamRetakeStats).toHaveBeenCalledWith(123, mockReq.parsedParams);

    // Verify response
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: true,
      data: mockRetakeStats
    });
  });

  it("should convert teamId to number", async () => {
    (getTeamRetakeStats as jest.Mock).mockResolvedValue([]);

    // Call controller
    await getTeamRetakeStatsController(
      mockReq as RequestWithParams<{ team_id: string }>,
      mockRes as Response
    );

    // Verify teamId was converted to number
    expect(getTeamRetakeStats).toHaveBeenCalledWith(123, expect.anything());
  });
});
