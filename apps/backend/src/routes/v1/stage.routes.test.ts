// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import type express from "express";
import { createExpressTestApp, setupEnvironment } from "../../test-utils";
import stageRouter from "./stage.routes";
import * as stageModels from "../../models/stage.models";

jest.mock("../../models/stage.models");

const mockGetAllStages = stageModels.getAllStages as jest.MockedFunction<
  typeof stageModels.getAllStages
>;

describe("Stage Routes Integration Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupEnvironment({
      FRONTEND_URL: "http://localhost:3000"
    });

    const { app: testApp } = createExpressTestApp(
      stageRouter,
      "/api/v1/stages"
    );
    app = testApp;

    jest.clearAllMocks();

    mockGetAllStages.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /", () => {
    it("should return stages list without authentication", async () => {
      const res = await request(app).get("/api/v1/stages");

      expect(res.status).toBe(200);
      expect(mockGetAllStages).toHaveBeenCalled();
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should handle errors properly", async () => {
      mockGetAllStages.mockRejectedValue(new Error("Database error"));

      const res = await request(app).get("/api/v1/stages");

      // Generic errors default to 400 status in error handler
      expect(res.status).toBe(400);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    });
  });
});
