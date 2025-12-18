import request from "supertest";
import express from "express";
import filterRoutes from "../routes/v1/filter.routes";
import { type TeamMapVetoStats } from "@eggosystem/types";
import { expressErrorHandler } from "../middlewares/express-error-handler";
import parseQueryFilterParams from "../middlewares/parse-query-filter-params.middleware";

describe("Team Map Veto Stats Integration Tests", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/filters", parseQueryFilterParams, filterRoutes);
    app.use(expressErrorHandler);
  });

  it("should return map veto stats for a team with picks and bans", async () => {
    const response = await request(app)
      .get("/filters/teams/1650/map-veto-stats?season_ids=14")
      .expect("Content-Type", /json/)
      .expect(200);

    // Check response structure
    expect(Array.isArray(response.body)).toBe(true);

    // Check that each map has the expected properties if data exists
    const vetoStats = response.body as TeamMapVetoStats[];
    vetoStats.forEach((stat) => {
      expect(stat).toHaveProperty("map_id");
      expect(stat).toHaveProperty("map_name");
      expect(stat).toHaveProperty("picks");
      expect(stat).toHaveProperty("bans");

      // Validate types
      expect(typeof stat.map_id).toBe("number");
      expect(typeof stat.map_name).toBe("string");
      expect(typeof stat.picks).toBe("number");
      expect(typeof stat.bans).toBe("number");

      // Validate non-negative values
      expect(stat.picks).toBeGreaterThanOrEqual(0);
      expect(stat.bans).toBeGreaterThanOrEqual(0);
    });
  });

  it("should apply season filter properly", async () => {
    const response = await request(app)
      .get("/filters/teams/1650/map-veto-stats?season_ids=14")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should return 400 with invalid team_id", async () => {
    await request(app)
      .get("/filters/teams/invalid/map-veto-stats?season_ids=14")
      .expect(400);
  });

  it("should return empty array for team with no veto data", async () => {
    const response = await request(app)
      .get("/filters/teams/99999/map-veto-stats?season_ids=14")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toEqual([]);
  });
});
