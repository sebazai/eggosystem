// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import type express from "express";
import { createExpressTestApp, setupEnvironment } from "../../test-utils";
import hallOfFameRouter from "./hall-of-fame.routes";
import * as hallOfFameControllers from "../../controllers/hall-of-fame.controllers";

jest.mock("../../controllers/hall-of-fame.controllers");

const mockGetHallOfFameController =
  hallOfFameControllers.getHallOfFameController as jest.MockedFunction<
    typeof hallOfFameControllers.getHallOfFameController
  >;

describe("Hall of Fame Routes Integration Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupEnvironment({
      FRONTEND_URL: "http://localhost:3000"
    });

    const { app: testApp } = createExpressTestApp(
      hallOfFameRouter,
      "/api/v1/hall-of-fame"
    );
    app = testApp;

    jest.clearAllMocks();

    mockGetHallOfFameController.mockImplementation(async (req, res) => {
      res.status(200).json({ items: [] });
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /", () => {
    it("should return hall of fame data without authentication", async () => {
      const res = await request(app).get("/api/v1/hall-of-fame");

      expect(res.status).toBe(200);
      expect(mockGetHallOfFameController).toHaveBeenCalled();
    });

    it("should accept query parameters", async () => {
      const res = await request(app).get(
        "/api/v1/hall-of-fame?category=teams&limit=10"
      );

      expect(res.status).toBe(200);
      expect(mockGetHallOfFameController).toHaveBeenCalled();
    });
  });
});
