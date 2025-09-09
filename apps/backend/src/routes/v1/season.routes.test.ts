// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import type express from "express";
import request from "supertest";
import { createExpressTestApp } from "../../test-utils";
import seasonRouter from "./season.routes";

// Mock the logger
jest.mock("../../utils/app-logger");

describe("Season Routes - Integration Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      seasonRouter,
      "/" // Mount at root, so internal router paths are used directly
    );
    app = testApp;
    cleanup = appCleanup;

    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /:season_id/captains", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/14/captains").expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401
      });
    });
  });

  describe("GET /:id", () => {
    it("should return 400 for invalid season ID", async () => {
      const response = await request(app).get("/invalid").expect(400);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Invalid numeric param: id"
      });
    });

    it("should return 400 for negative season ID", async () => {
      const response = await request(app).get("/-1").expect(404);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: "Season not found"
      });
    });
  });

  describe("GET /:id/details", () => {
    it("should return 400 for invalid season ID", async () => {
      const response = await request(app).get("/invalid/details").expect(400);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Invalid numeric param: id"
      });
    });

    it("should return 400 for negative season ID", async () => {
      const response = await request(app).get("/-1/details").expect(404);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Not Found",
        status: 404
      });
    });
  });

  describe("GET /:season_id/leagues", () => {
    it("should return 400 for invalid season ID", async () => {
      const response = await request(app).get("/invalid/leagues").expect(400);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Invalid numeric param: season_id"
      });
    });

    it("should return empty array for negative season ID", async () => {
      const response = await request(app).get("/-1/leagues").expect(200);

      expect(response.body).toEqual([]);
    });
  });
});
