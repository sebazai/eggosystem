// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import express from "express";
import { createExpressTestApp } from "../../test-utils";
import filterRouter from "./filter.routes";
import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";

describe("Leaderboards Integration Tests", () => {
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

  // Test for multiple leaderboards endpoint (returns all stats)
  test("GET /api/v1/filters/leaderboards/multiple - should return all leaderboards", async () => {
    const response = await request(app)
      .get("/api/v1/filters/leaderboards/multiple")
      .query({ leaderboards: "kills" }); // This param doesn't actually filter to just kills

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("kills");
    expect(response.body).toHaveProperty("deaths");
    expect(response.body).toHaveProperty("assists");
    expect(Array.isArray(response.body.kills)).toBe(true);
  }, 30000); // 30 second timeout

  // Test one of the new derived stats
  test("GET /api/v1/filters/leaderboards/multiple - should include derived stats", async () => {
    const response = await request(app)
      .get("/api/v1/filters/leaderboards/multiple")
      .query({ leaderboards: "kills_per_round" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("kills_per_round");
    expect(Array.isArray(response.body.kills_per_round)).toBe(true);
  });

  // Test another derived stat
  test("GET /api/v1/filters/leaderboards/multiple - should include flash time stats", async () => {
    const response = await request(app)
      .get("/api/v1/filters/leaderboards/multiple")
      .query({ leaderboards: "avg_enemy_flash_time" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("avg_enemy_flash_time");
    expect(Array.isArray(response.body.avg_enemy_flash_time)).toBe(true);
  });

  // Test for single leaderboard endpoint
  test("GET /api/v1/filters/leaderboards - should return single leaderboard", async () => {
    const response = await request(app)
      .get("/api/v1/filters/leaderboards")
      .query({ leaderboards: "kills" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("kills");
    expect(Object.keys(response.body).length).toBe(1); // Only the requested leaderboard
    expect(Array.isArray(response.body.kills)).toBe(true);
  });

  // Skip the season_ids test until issue #173 is fixed
  test("GET /api/v1/filters/leaderboards/multiple - should work with season_ids filter", async () => {
    const response = await request(app)
      .get("/api/v1/filters/leaderboards/multiple")
      .query({ season_ids: "14" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("kills");
    expect(response.body).toHaveProperty("kana_rating");
    expect(response.body).toHaveProperty("kast");
    expect(Array.isArray(response.body.kills)).toBe(true);
  });
});
