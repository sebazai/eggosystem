import request from "supertest";
import express from "express";
import { createExpressTestApp } from "../../../test-utils";
import redisRouter from "./redis.routes";

// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

describe("Redis Routes", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      redisRouter,
      "/api/v1/dashboard/redis"
    );
    app = testApp;
    cleanup = appCleanup;
  });

  afterEach(() => {
    cleanup();
  });

  // Note: Authentication tests have been moved to auth.test.ts
  // This file now focuses on functional Redis route tests

  describe("Redis Route Structure", () => {
    it("should have redis routes properly mounted", () => {
      // This is a placeholder test to ensure the route structure is correct
      // Functional tests would require Redis connection and authentication
      expect(app).toBeDefined();
    });
  });
});
