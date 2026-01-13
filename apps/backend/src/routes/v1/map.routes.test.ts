// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import type express from "express";
import { createExpressTestApp, setupEnvironment } from "../../test-utils";
import mapRouter from "./map.routes";
import * as mapsControllers from "../../controllers/maps.controllers";

jest.mock("../../controllers/maps.controllers");

const mockGetAllMaps = mapsControllers.getAllMaps as jest.MockedFunction<
  typeof mapsControllers.getAllMaps
>;

describe("Map Routes Integration Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupEnvironment({
      FRONTEND_URL: "http://localhost:3000"
    });

    const { app: testApp } = createExpressTestApp(mapRouter, "/api/v1/maps");
    app = testApp;

    jest.clearAllMocks();

    mockGetAllMaps.mockImplementation(async (req, res) => {
      res.status(200).json({ maps: [] });
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /", () => {
    it("should return maps list without authentication", async () => {
      const res = await request(app).get("/api/v1/maps");

      expect(res.status).toBe(200);
      expect(mockGetAllMaps).toHaveBeenCalled();
    });

    it("should handle errors properly", async () => {
      mockGetAllMaps.mockImplementation(async () => {
        throw new Error("Database error");
      });

      const res = await request(app).get("/api/v1/maps");

      // Generic errors default to 400 status in error handler
      expect(res.status).toBe(400);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    });
  });
});
