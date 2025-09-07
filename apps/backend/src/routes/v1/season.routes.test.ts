// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import type express from "express";
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

    it("should return 401 for invalid season_id (auth required first)", async () => {
      const response = await request(app).get("/invalid/captains").expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401
      });
    });

    it("should return 401 for negative season_id (auth required first)", async () => {
      const response = await request(app).get("/-1/captains").expect(401);

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
      const response = await request(app).get("/-1").expect(400);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400
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
      const response = await request(app).get("/-1/details").expect(400);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400
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

    it("should return 200 for negative season ID (no validation middleware)", async () => {
      const response = await request(app).get("/-1/leagues").expect(200);

      // This route doesn't have validation middleware, so it passes through
      expect(response.body).toBeDefined();
    });
  });
});
