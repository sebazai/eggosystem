// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import type express from "express";
import { createExpressTestApp, setupEnvironment } from "../../test-utils";
import organizerRouter from "./organizer.routes";
import * as organizerControllers from "../../controllers/organizer.controllers";

jest.mock("../../controllers/organizer.controllers");

const mockGetActiveSeasonForApp =
  organizerControllers.getActiveSeasonForApp as jest.MockedFunction<
    typeof organizerControllers.getActiveSeasonForApp
  >;
const mockGetActiveSignupOrActiveSeasonForAppController =
  organizerControllers.getActiveSignupOrActiveSeasonForAppController as jest.MockedFunction<
    typeof organizerControllers.getActiveSignupOrActiveSeasonForAppController
  >;
const mockRedirectToActiveSignup =
  organizerControllers.redirectToActiveSignup as jest.MockedFunction<
    typeof organizerControllers.redirectToActiveSignup
  >;

describe("Organizer Routes Integration Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupEnvironment({
      FRONTEND_URL: "http://localhost:3000"
    });

    const { app: testApp } = createExpressTestApp(
      organizerRouter,
      "/api/v1/organizers"
    );
    app = testApp;

    jest.clearAllMocks();

    mockGetActiveSeasonForApp.mockImplementation(async (req, res) => {
      res.status(200).json({ season: null });
    });
    mockGetActiveSignupOrActiveSeasonForAppController.mockImplementation(
      async (req, res) => {
        res.status(200).json({ season: null });
      }
    );
    mockRedirectToActiveSignup.mockImplementation(async (req, res) => {
      res.redirect("http://localhost:3000/seasons/123/signup");
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /:organizer_id/app/:app_id/seasons/active", () => {
    it("should validate numeric params", async () => {
      const res = await request(app).get(
        "/api/v1/organizers/invalid/app/730/seasons/active"
      );

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
    });

    it("should return active season without authentication", async () => {
      const res = await request(app).get(
        "/api/v1/organizers/1/app/730/seasons/active"
      );

      expect(res.status).toBe(200);
      expect(mockGetActiveSeasonForApp).toHaveBeenCalled();
    });
  });

  describe("GET /:organizer_id/app/:app_id/seasons/active-signup-open", () => {
    it("should validate numeric params", async () => {
      const res = await request(app).get(
        "/api/v1/organizers/invalid/app/730/seasons/active-signup-open"
      );

      expect(res.status).toBe(400);
    });

    it("should return season without authentication", async () => {
      const res = await request(app).get(
        "/api/v1/organizers/1/app/730/seasons/active-signup-open"
      );

      expect(res.status).toBe(200);
      expect(
        mockGetActiveSignupOrActiveSeasonForAppController
      ).toHaveBeenCalled();
    });
  });

  describe("GET /:organizer_id/app/:app_id/signup-redirect", () => {
    it("should validate numeric params", async () => {
      const res = await request(app).get(
        "/api/v1/organizers/invalid/app/730/signup-redirect?gametype=comp"
      );

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
    });

    it("should redirect to signup page when active season is found", async () => {
      const res = await request(app).get(
        "/api/v1/organizers/1/app/730/signup-redirect?gametype=comp"
      );

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(
        "http://localhost:3000/seasons/123/signup"
      );
      expect(mockRedirectToActiveSignup).toHaveBeenCalled();
    });

    it("should use default gametype when gametype query parameter is missing", async () => {
      mockRedirectToActiveSignup.mockImplementation(async (req, res) => {
        res.redirect("http://localhost:3000/seasons/123/signup");
      });

      const res = await request(app).get(
        "/api/v1/organizers/1/app/730/signup-redirect"
      );

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(
        "http://localhost:3000/seasons/123/signup"
      );
      expect(mockRedirectToActiveSignup).toHaveBeenCalled();
    });

    it("should work without authentication", async () => {
      const res = await request(app).get(
        "/api/v1/organizers/1/app/730/signup-redirect?gametype=comp"
      );

      expect(res.status).toBe(302);
      expect(mockRedirectToActiveSignup).toHaveBeenCalled();
    });
  });
});
