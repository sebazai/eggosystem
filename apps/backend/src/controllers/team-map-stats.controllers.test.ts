import request from "supertest";
import express from "express";
import filterRoutes from "../routes/v1/filter.routes";
import { type TeamMapStats } from "@eggosystem/types";
import { expressErrorHandler } from "../middlewares/express-error-handler";
import parseQueryFilterParams from "../middlewares/parse-query-filter-params.middleware";

describe("Team Map Stats Integration Tests", () => {
  let app: express.Application;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/filters", parseQueryFilterParams, filterRoutes);
    app.use(expressErrorHandler);
  });
  it("should return enhanced map stats for a team with proper CT/T side data", async () => {
    const response = await request(app)
      .get("/filters/teams/1650/enhanced-map-stats?season_ids=14")
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
    // Test with multiple filters
    const response = await request(app)
      .get("/filters/teams/1650/enhanced-map-stats?season_ids=14&map_ids=1")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);

    // Should only include maps matching the filter
    const mapStats = response.body as TeamMapStats[];
    expect(mapStats.every((map) => map.map_id === 1)).toBe(true);
  });

  it("should return 400 with invalid team_id", async () => {
    await request(app)
      .get("/filters/teams/invalid/enhanced-map-stats?season_ids=14")
      .expect(400);
  });

  it("should return accurate K/D and kill/death stats for team 66 on map 3", async () => {
    const response = await request(app)
      .get("/filters/teams/66/enhanced-map-stats?season_ids=14&map_ids=3")
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
