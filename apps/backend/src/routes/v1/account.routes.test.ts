// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import express from "express";
import { createExpressTestApp, setupEnvironment } from "../../test-utils";
import { createMockUserPayload } from "@eggosystem/types";
import { authenticateJWT } from "../../middlewares/auth.middleware";

// Mock express-jwt BEFORE importing routes
jest.mock("express-jwt", () => ({
  expressjwt: jest.fn(
    () =>
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        const authHeader = req.headers.authorization;
        if (authHeader === "Bearer valid_token") {
          req.auth = createMockUserPayload({
            account_id: 1,
            provider_id: "76561198049745649",
            nickname: "testuser",
            provider: "steam"
          });
          next();
        } else {
          const UnauthorizedError =
            require("../../utils/errors").UnauthorizedError;
          next(new UnauthorizedError("Unauthorized"));
        }
      }
  )
}));

// Import routes AFTER mocking
import accountRouter from "./account.routes";
import * as accountControllers from "../../controllers/account.controllers";
import * as authModels from "../../models/auth.models";
import * as userPolicyAcceptanceModels from "../../models/user-policy-acceptance.models";

// Mock controllers and models
jest.mock("../../controllers/account.controllers");
jest.mock("../../models/auth.models");
jest.mock("../../models/user-policy-acceptance.models");

const mockEmailsVerifiedController =
  accountControllers.emailsVerifiedController as jest.MockedFunction<
    typeof accountControllers.emailsVerifiedController
  >;
const mockSendVerificationEmails =
  accountControllers.sendVerificationEmails as jest.MockedFunction<
    typeof accountControllers.sendVerificationEmails
  >;
const mockUpdateAccountProfileController =
  accountControllers.updateAccountProfileController as jest.MockedFunction<
    typeof accountControllers.updateAccountProfileController
  >;
const mockGetAuthUserBySteamId =
  authModels.getAuthUserBySteamId as jest.MockedFunction<
    typeof authModels.getAuthUserBySteamId
  >;
const mockGetUserProfileAcceptanceForVersion =
  userPolicyAcceptanceModels.getUserProfileAcceptanceForVersion as jest.MockedFunction<
    typeof userPolicyAcceptanceModels.getUserProfileAcceptanceForVersion
  >;
const mockGetLatestUserProfileNewsletterConsent =
  userPolicyAcceptanceModels.getLatestUserProfileNewsletterConsent as jest.MockedFunction<
    typeof userPolicyAcceptanceModels.getLatestUserProfileNewsletterConsent
  >;

describe("Account Routes Integration Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupEnvironment({
      FRONTEND_URL: "http://localhost:3000",
      PRIVACY_POLICY_VERSION: "1"
    });

    // Create a custom router that includes JWT authentication middleware
    // This ensures authenticateJWT is applied to all routes
    const customRouter = express.Router();
    customRouter.use(authenticateJWT);
    customRouter.use(accountRouter);

    const { app: testApp } = createExpressTestApp(
      customRouter,
      "/api/v1/accounts"
    );
    app = testApp;

    jest.clearAllMocks();

    // Setup default mocks
    mockGetAuthUserBySteamId.mockResolvedValue({
      account_id: 1,
      steam_id: "76561198049745649",
      nickname: "testuser",
      is_work_email_personal_email: false,
      provider: "steam",
      full_name: "Test User",
      work_email: "test@example.com"
    });
    mockGetUserProfileAcceptanceForVersion.mockResolvedValue(null);
    mockGetLatestUserProfileNewsletterConsent.mockResolvedValue(true);
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /profile", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app).get("/api/v1/accounts/profile");

      expect(res.status).toBe(401);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    });

    it("should return user profile when authenticated with Steam", async () => {
      const res = await request(app)
        .get("/api/v1/accounts/profile")
        .set("Authorization", "Bearer valid_token");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("details");
      expect(res.body.details).toHaveProperty("fullName");
      expect(res.body.details).toHaveProperty("workEmail");
      expect(res.body.details).toHaveProperty("acceptedNewsletter");
    });

    it("should return 403 when user not found in database", async () => {
      mockGetAuthUserBySteamId.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/v1/accounts/profile")
        .set("Authorization", "Bearer valid_token");

      expect(res.status).toBe(403);
      expect(res.body.detail).toContain("Bad request");
    });
  });

  describe("POST /update", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app)
        .post("/api/v1/accounts/update")
        .send({ fullName: "New Name" });

      expect(res.status).toBe(401);
    });

    it("should require authentication for profile update", async () => {
      mockUpdateAccountProfileController.mockImplementation(
        async (req, res) => {
          res.status(200).json({ success: true });
        }
      );

      const res = await request(app)
        .post("/api/v1/accounts/update")
        .set("Authorization", "Bearer valid_token")
        .send({ fullName: "New Name" });

      expect(res.status).toBe(200);
    });
  });

  describe("GET /:id/emails-verified", () => {
    it("should validate numeric params", async () => {
      const res = await request(app).get(
        "/api/v1/accounts/invalid/emails-verified"
      );

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
    });

    it("should call emailsVerifiedController with valid numeric id", async () => {
      mockEmailsVerifiedController.mockImplementation(async (req, res) => {
        res.status(200).json({ verified: true });
      });

      const res = await request(app).get(
        "/api/v1/accounts/123/emails-verified"
      );

      expect(mockEmailsVerifiedController).toHaveBeenCalled();
      expect(res.status).toBe(200);
    });
  });

  describe("POST /:id/emails/send-verifications", () => {
    it("should validate numeric params", async () => {
      const res = await request(app).post(
        "/api/v1/accounts/invalid/emails/send-verifications"
      );

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
    });

    it("should call sendVerificationEmails with valid numeric id", async () => {
      mockSendVerificationEmails.mockImplementation(async (req, res) => {
        res.status(200).json({ sent: true });
      });

      const res = await request(app).post(
        "/api/v1/accounts/123/emails/send-verifications"
      );

      expect(mockSendVerificationEmails).toHaveBeenCalled();
      expect(res.status).toBe(200);
    });
  });

  describe("Caster default URL routes", () => {
    it("should require authentication for GET /caster/default-url", async () => {
      const res = await request(app).get("/api/v1/accounts/caster/default-url");

      expect(res.status).toBe(401);
    });

    it("should require caster role for GET /caster/default-url", async () => {
      // Mock user without caster role
      const res = await request(app)
        .get("/api/v1/accounts/caster/default-url")
        .set("Authorization", "Bearer valid_token");

      // Should return 403 if user doesn't have caster role
      expect([401, 403]).toContain(res.status);
    });

    it("should require authentication for POST /caster/default-url", async () => {
      const res = await request(app)
        .post("/api/v1/accounts/caster/default-url")
        .send({ url: "https://example.com" });

      expect(res.status).toBe(401);
    });

    it("should require authentication for DELETE /caster/default-url", async () => {
      const res = await request(app).delete(
        "/api/v1/accounts/caster/default-url"
      );

      expect(res.status).toBe(401);
    });
  });

  describe("GET /reservations/match/:match_id", () => {
    it("should validate numeric params", async () => {
      const res = await request(app).get(
        "/api/v1/accounts/reservations/match/invalid"
      );

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
    });

    it("should require authentication", async () => {
      const res = await request(app).get(
        "/api/v1/accounts/reservations/match/123"
      );

      expect(res.status).toBe(401);
    });

    it("should require caster role", async () => {
      const res = await request(app)
        .get("/api/v1/accounts/reservations/match/123")
        .set("Authorization", "Bearer valid_token");

      expect([401, 403]).toContain(res.status);
    });
  });

  describe("My Team routes", () => {
    it("should require authentication for GET /my-teams", async () => {
      const res = await request(app).get("/api/v1/accounts/my-teams");

      expect(res.status).toBe(401);
    });

    it("should require authentication for GET /my-teams/upcoming-matches", async () => {
      const res = await request(app).get(
        "/api/v1/accounts/my-teams/upcoming-matches"
      );

      expect(res.status).toBe(401);
    });

    it("should validate numeric params for GET /my-teams/championships/:season_id/:league_id", async () => {
      const res = await request(app).get(
        "/api/v1/accounts/my-teams/championships/invalid/123"
      );

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
    });

    it("should require authentication for championships endpoint", async () => {
      const res = await request(app).get(
        "/api/v1/accounts/my-teams/championships/1/2"
      );

      expect(res.status).toBe(401);
    });

    it("should require authentication for POST /my-teams/upload-logo", async () => {
      const res = await request(app).post(
        "/api/v1/accounts/my-teams/upload-logo"
      );

      expect(res.status).toBe(401);
    });

    it("should require authentication for POST /upload-avatar", async () => {
      const res = await request(app).post("/api/v1/accounts/upload-avatar");

      expect(res.status).toBe(401);
    });
  });
});
